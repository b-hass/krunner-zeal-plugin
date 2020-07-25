import * as fs from 'fs'
import {homedir} from 'os'
import * as sqlite3 from 'sqlite3'

import {start} from './dbus-connection'

interface IndexEntry {
  name: string
  type: string
  path: string
}

interface IndexResult {
  results: IndexEntry[]
  docsetName: string,
}

type IndexQuery = (query: string) => Promise<IndexResult>

type DBMap = {
  [docsetName: string]: IndexQuery
}

const zealDir = `${homedir()}/.local/share/Zeal/Zeal/docsets`

const files = fs.readdirSync(zealDir).filter(file => file.includes('.docset'))
const dbs: DBMap = files
  .reduce((acc, file) => {
    const db = new sqlite3.Database(`${zealDir}/${file}/Contents/Resources/docSet.dsidx`)
    const metadata = fs.readFileSync(`${zealDir}/${file}/Contents/Info.plist`, 'utf-8')
    const docsetName = /<string>(\w+)<\/string>/.exec(metadata)[1]

    return {
      ...acc, 
      [docsetName]: (query: string): Promise<IndexResult> =>
        new Promise((resolve, reject) => {
          db.all(query, (err, results: IndexEntry[]) => {
            if (err) {
              reject(err)
            } else {
              resolve({results, docsetName})
            }
          })
        })
      }
  }, {})

const dbsList = Object.values(dbs)

type Query =  { db?: string, term: string }

async function queryIndex(query: Query): Promise<string[]> {
  try {
    const dbQuery = query.term === '' ?
      `SELECT * FROM 'searchIndex' LIMIT 5` :
      `SELECT * FROM 'searchIndex' WHERE name LIKE '%${query.term}%' COLLATE NOCASE LIMIT 5`

    const queryDB = query.db && dbs[query.db]

    const queries = queryDB ? [queryDB(dbQuery)] : dbsList.map(getAll => getAll(dbQuery))
  
    const data = await Promise.all(queries)
  
    return data.flatMap(({results, docsetName}) =>
      results.map(entry => `${docsetName}:${entry.name}`))
  } catch (err) {
    console.log(err)
  }
}

function parseQuery (query: string): Query {
  if (query.includes(':')) {
    const [db, term] = query.split(':')
    return  {db, term}
  } else {
    return {term: query}
  }
}

async function queryDocsIndexes (query: string): Promise<string[]> {
  const parsedQuery = parseQuery(query)

  const result = await queryIndex(parsedQuery)

  return result.slice(0, 10)
}


start(queryDocsIndexes)
