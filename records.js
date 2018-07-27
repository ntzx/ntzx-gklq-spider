var RecordPipes = []

export function newRecord (
  id,
  name,
  sex,
  university,
  major,
  elementary,
  junior,
  year
) {
  return {
    $id: id,
    $name: name,
    $sex: sex,
    $university: university,
    $major: major,
    $elementary: elementary,
    $junior: junior,
    $year: year
  }
}

export function registerRecordPipe (fn) {
  RecordPipes.push(fn)
}

export function cleanRecord (rc) {
  for (let fn of RecordPipes) {
    fn(rc)
  }
}

registerRecordPipe(rc => {
  let patt = /(^\s*)|(\s*$)/g
  for (let key in rc) {
    rc[key] = rc[key].replace(patt, '')
  }
})

registerRecordPipe(rc => {
  if (rc.$sex !== '男' && rc.$sex !== '女') {
    rc.$sex = ''
  }
})

registerRecordPipe(rc => {
  if (rc.$major === '1') {
    rc.$major = ''
  }
})

registerRecordPipe(rc => {
  if (rc.$elementary === '1' || rc.$elementary === '55') {
    rc.$elementary = ''
  }
})

registerRecordPipe(rc => {
  if (rc.$junior === '1' || rc.$junior === '55') {
    rc.$junior = ''
  }
})

registerRecordPipe(rc => {
  if (rc.$junior.indexOf('启秀') !== -1) {
    rc.$junior = '启秀中学'
  }
})

registerRecordPipe(rc => {
  if (rc.$elementary.indexOf('二附') !== -1) {
    rc.$elementary = '通师二附'
  }
})

registerRecordPipe(rc => {
  if (rc.$junior.indexOf('幸福') !== -1) {
    rc.$junior = '南通市幸福中学'
  }
})

registerRecordPipe(rc => {
  if (rc.$junior === '启东') {
    rc.$junior = ''
  }
})

registerRecordPipe(rc => {
  if (rc.$elementary === '启东') {
    rc.$elementary = ''
  }
})
