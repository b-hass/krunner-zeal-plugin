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

const zealDir = `${homedir()}/.local/share/Zeal/Zeal/docsets`

const files = fs.readdirSync(zealDir).filter(file => file.includes('.docset'))
const dbs: IndexQuery[] = files
  .map(file => {
    const db = new sqlite3.Database(`${zealDir}/${file}/Contents/Resources/docSet.dsidx`)
    const docsetName = file.replace('.docset', '').toLowerCase()

    return (query): Promise<IndexResult> =>
      new Promise((resolve, reject) => {
        db.all(query, (err, results: IndexEntry[]) => {
          if (err) {
            reject(err)
          } else {
            resolve({results, docsetName})
          }
        })
      })
  })

async function queryIndex(query:string): Promise<string[]> {
  try {
    const queries = dbs.map(getAll => getAll(query))
  
    const data = await Promise.all(queries)
  
    return data.flatMap(({results, docsetName}) =>
      results.map(entry => `${docsetName} : ${entry.name}`))
  } catch (err) {
    console.log(err)
  }
}

async function queryDocsIndexes (queryTerm: string): Promise<string[]> {
  const query = `SELECT * FROM 'searchIndex' WHERE name LIKE '%${queryTerm}%' COLLATE NOCASE LIMIT 5`;

  const result = await queryIndex(query)
  console.log(result)

  return result.slice(0, 10)
}

start(queryDocsIndexes)
