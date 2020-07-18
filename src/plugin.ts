import * as fs from 'fs'
import {homedir} from 'os'
import * as sqlite3 from 'sqlite3'

import {start} from './dbus-connection'


const [queryTerm] = process.argv.slice(2)

const zealDir = `${homedir()}/.local/share/Zeal/Zeal/docsets`

interface IndexEntry {
  name: string
  type: string
  path: string
}

const query = `SELECT * FROM 'searchIndex' WHERE name LIKE '%${queryTerm}%' LIMIT 0,30`;

fs.readdir(zealDir, (err, files) => {
  if (err) {
    console.error(err);
    process.exit(1)
  }

  files
    .filter(file => file.includes('.docset'))
    .forEach(file => {
      const db = new sqlite3.Database(`${zealDir}/${file}/Contents/Resources/docSet.dsidx`)
      
      db.all(query, function (err, result: IndexEntry[]) {
        if (err) {
          console.error(err);
          process.exit(1)
        }

        if (result.length > 0) {
          const output = result.map(res => res.path).join('\n')
        }
      })
    })
})



