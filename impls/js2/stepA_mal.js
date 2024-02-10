import { pr_str } from './printer.js'
import { MalError } from './core.js'
import { makeREP } from './lib_stepA.js'

const rep = makeREP()

const commandLineArgs = process.argv.slice(2)
const [first, ...rest] = commandLineArgs

rep('(def! *ARGV* (list ' + rest.map(x => `"${x}"`).join(' ') + '))')

import { question } from 'readline-sync'

if (commandLineArgs.length > 0) {
  rep(`(load-file "${first}")`)
} else {
  while (true) {
    const line = question(`user> `)
    if (line === '') {
      console.log(`Bye!`)
      break
    }
    try {
      console.log(rep(line))
    } catch (e) {
      if (e instanceof MalError) console.log('error: ' + pr_str(e.value))
      else console.log(e.message)
    }
  }
}
