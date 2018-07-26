import axios from 'axios'
import iconv from 'iconv-lite'
import sqlite3 from 'sqlite3'

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
  // id name sex university elementary major junior year

  let parts = []
  let r = 1
  while (r) {
    parts.push(r)
    r = patt.exec(text)
  }
  parts.splice(0, 1)

  parts = parts.map(p => ({
    $id: p[1],
    $name: p[2],
    $sex: p[3],
    $university: p[4],
    $major: p[5],
    $elementary: p[6],
    $junior: p[7],
    $year: p[8]
  }))
  return parts
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
  var chunknum = 50

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
            rc.$id + (err ? ` fail: ${err}` : ' success') + ` count: ${count}`
          )
        }
      )
    })
  }
})()

function cleanRecord (rc) {
  let patt = /(^\s*)|(\s*$)/g
  for (let key in rc) {
    rc[key] = rc[key].replace(patt, '')
  }

  if (rc.$sex !== '男' || rc.$sex !== '女') {
    rc.$sex = ''
  }

  if (rc.$major === '1') {
    rc.$major = ''
  }

  if (rc.$elementary === '1' || rc.$elementary === '55') {
    rc.$elementary = ''
  }

  if (rc.$junior === '1' || rc.$junior === '55') {
    rc.$junior = ''
  }
}
