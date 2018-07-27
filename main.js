import axios from 'axios'
import iconv from 'iconv-lite'
import sqlite3 from 'sqlite3'

import { newRecord, cleanRecord } from './records'

var db = new sqlite3.Database('ntzx-gklq-data.db')

export function main () {
  initDB()
  download().then(res => console.log('Finished'))
}

function initDB () {
  db.serialize(() => {
    db.get(
      `SELECT 1 WHERE EXISTS(SELECT * FROM sqlite_master WHERE name="students" and type="table")`,
      (err, row) => {
        if (!err && !row) {
          db.run(`CREATE TABLE students(
          id INTEGER PRIMARY KEY,
          name NCHAR(12),
          sex NCHAR(6),
          university NCHAR(30),
          major NTEXT,
          elementary NCHAR(30),
          junior NCHAR(30),
          year INTEGER,
          UNIQUE(id)
        )`)
        }
      }
    )
  })
}

function extractData (text) {
  text = /<center[\s\S]*?\/center>/.exec(text)[0]
  let patt = /<td.+?><font.*?>.*?<\/font>.*?<\/td>[\s\S]*?<td.+?>(.*?)<\/td>[\s\S]*?<td.+?>(.*?)<\/td>[\s\S]*?<td.+?>(.*?)<\/td>[\s\S]*?<td.+?>(.*?)<\/td>[\s\S]*?<td.+?>(.*?)<\/td>[\s\S]*?<td.+?>(.*?)<\/td>[\s\S]*?<td.+?>(.*?)<\/td>[\s\S]*?<td.+?>(.*?)<\/td>/g
  // id name sex university major elementary junior year

  let parts = []
  let r = 1
  while (r) {
    parts.push(r)
    r = patt.exec(text)
  }
  parts.splice(0, 1)

  return parts.map(p => newRecord(...p.slice(1, 9)))
}

async function sendGet (page) {
  var rv = true

  await axios
    .get('http://gklq.ntzx.cn/index.asp', {
      params: {
        page
      },
      responseType: 'arraybuffer'
    })
    .then(resp => {
      let text = iconv.decode(resp.data, 'gbk')
      let rcs = extractData(text)
      if (rcs.length === 0) {
        rv = false
      } else {
        handleRecords(rcs)
      }
    })
    .catch(err => {
      if (err) {
        console.log(`Can not get page ${page}: ${err}`)
      }
    })
  return rv
}

async function download () {
  var flag = true
  var page = 1
  var chunknum = 100

  while (flag) {
    let ps = []
    for (let i = 0; i < chunknum; ++i) {
      ps.push(sendGet(i + page))
    }
    page += chunknum
    await Promise.all(ps).then(vals => {
      if (!vals.reduce((t, v) => t && v)) {
        flag = false
      }
    })
  }
}

var handleRecords = (() => {
  var count = 0
  return rcs => {
    rcs.forEach(rc => {
      cleanRecord(rc)
      db.run(
        `REPLACE INTO students VALUES(
        $id,
        $name,
        $sex,
        $university,
        $major,
        $elementary,
        $junior,
        $year
      )`,
        rc,
        (res, err) => {
          ++count
          console.log(
            rc.$id +
              (err ? ` failure: ${err}` : ' success') +
              ` count: ${count}`
          )
        }
      )
    })
  }
})()
