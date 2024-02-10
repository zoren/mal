import { read_str } from './reader.js'
import { list, isList, vector, hash_map } from './core.js'
import { pr_str } from './printer.js'

const READ = str => read_str(str)

const eval_ast = (ast, env) => {
  const { type, value } = ast
  switch (type) {
    case 'symbol':
      return env[value]
    case 'list':
      return list(...ast.value.map(x => EVAL(x, env)))
    case 'vector':
      return vector(...ast.value.map(x => EVAL(x, env)))
    case 'hash-map':
      return hash_map(
        ...[].concat(
          ...[...ast.value.entries()].map(([k, v]) => [k, EVAL(v, env)]),
        ),
      )
    default:
      return ast
  }
}

const EVAL = (ast, env) => {
  const evaluatedAST = eval_ast(ast, env)
  if (!isList(evaluatedAST)) return evaluatedAST
  if (evaluatedAST.value.length === 0) return ast
  const [efirst, ...rest] = evaluatedAST.value
  return efirst(...rest)
}

const PRINT = str => pr_str(str, true)

const repl_env = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => (a / b) | 0,
}

const rep = str => PRINT(EVAL(READ(str), repl_env))

import * as readline from 'node:readline'
import { stdin as input, nextTick, stdout as output } from 'node:process'

const rl = readline.createInterface({ input, output })

const prompt = () => {
  rl.question(`user> `, line => {
    if (line === '') {
      console.log(`Bye!`)
      rl.close()
      return
    }
    try {
      console.log(rep(line))
    } catch (e) {
      console.log(e.message)
    }
    nextTick(prompt)
  })
}

prompt()
