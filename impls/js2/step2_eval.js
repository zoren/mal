import { read_str, apply, list, vector, hash_map } from './reader.js'
import { pr_str } from './printer.js'

const READ = str => read_str(str)

const eval_ast = (ast, env) => {
  console.log('eval_ast', ast)
  const { type, value } = ast
  switch (type) {
    case 'symbol':
      return env[value]
    case 'list':
      return apply(
        list,
        ast.value.map(x => EVAL(x, env)),
      )
    case 'vector':
      return apply(
        vector,
        ast.value.map(x => EVAL(x, env)),
      )
    case 'hash-map':
      return apply(
        hash_map,
        ast.value.map(x => EVAL(x, env)),
      )
    default:
      return ast
  }
}

const isList = ast => ast.type === 'list'

const EVAL = (ast, env) => {
  const evaluatedAST = eval_ast(ast, env)
  if (!isList(evaluatedAST)) return evaluatedAST
  if (evaluatedAST.value.length === 0) return ast
  const [efirst, ...rest] = evaluatedAST.value
  return apply(efirst, rest)
}

const PRINT = str => pr_str(str)

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
