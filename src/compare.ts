import isObject from 'is-object'
import objPath from 'object-path'
import { highlight } from 'codechalk'
import chalk from 'chalk'
import type { Props } from './types'

function traverse(obj: Props['content'], callback: (path: string) => void, parentPath = '') {
  for (const key of Object.keys(obj)) {
    const path = parentPath ? `${parentPath}.${key}` : key
    callback(path)
    if (isObject(obj[key]))
      traverse(obj[key], callback, path)
  }
}

async function diff(base: Props['content'], compareWith: Props['content']) {
  const res = {}
  traverse(compareWith, (path) => {
    const s = objPath.get(base, path)
    if (!s)
      objPath.set(res, path, objPath.get(compareWith, path))
  })
  return res
}

export async function compare(fileA: Props, fileB: Props) {
  const aResult = await diff(fileA.content, fileB.content)
  const bResult = await diff(fileB.content, fileA.content)

  console.log(`${chalk.cyan(fileA.name)} missing keys:\n`)
  const aOut = await highlight(JSON.stringify(aResult, null, 2), 'json')
  console.log(`${aOut}\n\n`)

  console.log(`${chalk.cyan(fileB.name)} missing keys:\n`)
  const bOut = await highlight(JSON.stringify(bResult, null, 2), 'json')
  console.log(bOut)

  return {
    aResult,
    bResult,
  }
}
