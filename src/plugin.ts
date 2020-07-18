import * as fs from 'fs'
import {homedir} from 'os'
import * as sqlite3 from 'sqlite3'

import {start} from './dbus-connection'

const zealDir = `${homedir()}/.local/share/Zeal/Zeal/docsets`

interface IndexEntry {
  name: string
  type: string
  path: string
}


function queryIndex(query:string, file: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(`${zealDir}/${file}/Contents/Resources/docSet.dsidx`)
    const docsetName = file.replace('.docset', '')

    db.all(query, (err, result: IndexEntry[]) => {
      if (err) {
        reject(err)
      } else {
        resolve(result.map(row => `${docsetName} : ${row.name}`))
      }
    })
  })
}

async function queryDocsIndexes (queryTerm: string): Promise<string[]> {
  const query = `SELECT * FROM 'searchIndex' WHERE name LIKE '%${queryTerm}%' LIMIT 1`;

  const files = fs.readdirSync(zealDir).filter(file => file.includes('.docset'))
  
  const names = files.map(file => queryIndex(query, file))

  return (await Promise.all(names)).flat()
}

start(queryDocsIndexes)
