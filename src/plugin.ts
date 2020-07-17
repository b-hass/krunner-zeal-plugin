import sqlite3 from 'sqlite3'

const db = new sqlite3.Database("./elastic")

const [queryTerm] = process.argv.slice(2)

interface IndexEntry {
  name: string
  type: string
  path: string
}

const query = `SELECT * FROM 'searchIndex' WHERE name LIKE '%${queryTerm}%' LIMIT 0,30`;

db.all(query, function (err, result: IndexEntry[]) {
  if (err) {
    console.error(err);
    process.exit(1)
  }

  console.log(result);
});
