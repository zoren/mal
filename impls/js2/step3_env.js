import { Env } from './env.js'
import { read_str, apply, list, vector, hash_map } from './reader.js'
import { pr_str } from './printer.js'

const READ = str => read_str(str)

const eval_ast = (ast, env) => {
  const { type, value } = ast
  switch (type) {
    case 'symbol':
      return env.get(value)
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

const isSymbol = ast => ast.type === 'symbol'

const EVAL = (ast, env) => {
  if (!isList(ast)) return eval_ast(ast, env)
  if (ast.value.length === 0) return ast
  const [efirst, ...rest] = ast.value
  if (isSymbol(efirst)) {
    switch (efirst.value) {
      case 'def!': {
        const [symbol, value] = rest
        const ev = EVAL(value, env)
        env.set(symbol.value, ev)
        return ev
      }
      case 'let*': {
        const [bindings, body] = rest
        const newEnv = new Env(env)
        for (let i = 0; i < bindings.value.length; i += 2) {
          newEnv.set(
            bindings.value[i].value,
            EVAL(bindings.value[i + 1], newEnv),
          )
        }
        return EVAL(body, newEnv)
      }
    }
    const f = eval_ast(efirst, env)
    const args = rest.map(arg => EVAL(arg, env))
    return f(...args)
  }
  return eval_ast(ast, env)
}

const PRINT = str => pr_str(str)

const repl_env = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => (a / b) | 0,
}

const mkEnv = () => {
  const env = new Env()
  for (const key in repl_env) {
    env.set(key, repl_env[key])
  }
  return env
}

const rep = (str, env) => PRINT(EVAL(READ(str), env))

import * as readline from 'node:readline'
import { stdin as input, nextTick, stdout as output } from 'node:process'

const rl = readline.createInterface({ input, output })

const env = mkEnv()

const prompt = () => {
  rl.question(`user> `, line => {
    if (line === '') {
      console.log(`Bye!`)
      rl.close()
      return
    }
    try {
      console.log(rep(line, env))
    } catch (e) {
      console.log(e.message)
    }
    nextTick(prompt)
  })
}

prompt()
