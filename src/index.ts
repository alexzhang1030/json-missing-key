import { basename, resolve } from 'node:path'
import { cwd } from 'node:process'
import { readFile, writeFile } from 'node:fs/promises'
import consola from 'consola'
import meow from 'meow'
import { version } from '../package.json'
import type { Props } from './types'
import { compare } from './compare'
import deepMerge from './merge'

const cliDefinition = meow(`

  Version ${version}

  Usage
    $ json-missing-key <fileA> <fileB>

  Options

    --apply, -a   Apply missing keys, accept values: ['a', 'b', 'all'], a: apply fileA from fileB

  Examples

    $ json-missing-key foo.json bar.json --apply=a

    foo.json missing keys:
    {
      "foo": "bar",
      ...
    }

    bar.json missing keys:
    {
      "bar": "baz"
    }
`, {
  importMeta: import.meta,
  flags: {
    apply: {
      type: 'string',
      shortFlag: 'a',
    },
  },
})

async function main(args: string[], flags: (typeof cliDefinition)['flags'], cli: typeof cliDefinition) {
  if (!args.length)
    cli.showHelp(0)

  if (args.length !== 2)
    throw new Error('Please provide two files to compare')

  const fileAPath = resolve(cwd(), args[0])
  const fileBPath = resolve(cwd(), args[1])

  const res = await Promise.allSettled([
    readFile(fileAPath, 'utf-8'),
    readFile(fileBPath, 'utf-8'),
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
  const { aResult, bResult } = await compare(fileA, fileB)
  const tasks: Promise<void>[] = []
  if (!flags.apply)
    return
  if (flags.apply === 'a' || flags.apply === 'all') {
    tasks.push(
      writeFile(fileAPath, JSON.stringify(deepMerge(fileA.content, aResult), null, 2)),
    )
  }
  if (flags.apply === 'b' || flags.apply === 'all') {
    tasks.push(
      writeFile(fileBPath, JSON.stringify(deepMerge(fileB.content, bResult), null, 2)),
    )
  }
  if (tasks.length)
    await Promise.all(tasks)
}

try {
  await main(cliDefinition.input, cliDefinition.flags, cliDefinition)
}
catch (error) {
  consola.error((error as Error).message)
}
