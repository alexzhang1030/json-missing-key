import { readFile } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import meow from 'meow'
import consola from 'consola'
import type { Props } from './types'
import { compare } from './compare'

const cli = meow(`
  Usage
    $ json-missing-key <file1> <file2>

  Examples
    $ json-missing-key foo.json bar.json

    foo.json missing keys:
    {
      "foo": "bar",
      ...
    }

    bar.json missing keys:
    {
      "bar": "baz"
    }
`,
{
  importMeta: import.meta,
})

const main = async (args: string[]) => {
  if (args.length !== 2)
    throw new Error('Please provide two files to compare')
  const res = await Promise.allSettled([
    readFile(resolve(process.cwd(), args[0]), 'utf-8'),
    readFile(resolve(process.cwd(), args[1]), 'utf-8'),
  ])
  const [fileA, fileB] = res.map((item, index) => {
    if (item.status === 'rejected') {
      throw new Error(`Error reading file ${args[index]}`)
    }
    else {
      let content: Props['content']
      try {
        content = JSON.parse(item.value)
      }
      catch (error) {
        throw new Error(`Error parsing file ${args[index]}`)
      }
      return {
        name: basename(args[index]),
        content,
      } satisfies Props
    }
  })
  compare(fileA, fileB)
}

try {
  await main(cli.input)
}
catch (error) {
  consola.error((error as Error).message)
}
