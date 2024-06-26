import { Env } from './env.js'
import { read_str } from './reader.js'
import { pr_str } from './printer.js'
import { repl_env, list, isList, isSymbol, vector, hash_map } from './core.js'

const READ = str => read_str(str)

const eval_ast = (ast, env) => {
  if (ast === null) return null
  const { type, value } = ast
  switch (type) {
    case 'symbol':
      return env.get(value)
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
  if (ast === null) return null
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
      case 'do': {
        const evs = rest.map(x => EVAL(x, env))
        return evs.at(-1)
      }
      case 'if': {
        const [cond, t, f] =
          rest.length < 3 ? rest.concat(null, null, null) : rest
        const ev = EVAL(cond, env)
        const branch = ev === false || ev === null ? f : t
        return EVAL(branch, env)
      }
      case 'fn*': {
        const [params, body] = rest
        const ampIndex = params.value.findIndex(p => p.value === '&')
        const regParamEnd = ampIndex === -1 ? params.value.length : ampIndex
        const restParam = ampIndex === -1 ? null : params.value[ampIndex + 1]
        return (...args) => {
          const newEnv = new Env(env)
          for (let i = 0; i < regParamEnd; i++) {
            newEnv.set(params.value[i].value, args[i])
          }
          if (restParam) {
            const restArgs = args.slice(regParamEnd)
            newEnv.set(restParam.value, list(...restArgs))
          }
          return EVAL(body, newEnv)
        }
      }
    }
  }
  const f = EVAL(efirst, env)
  const args = rest.map(arg => EVAL(arg, env))
  return f(...args)
}

const PRINT = str => pr_str(str, true)

const rep = (str, env) => PRINT(EVAL(READ(str), env))

import * as readline from 'node:readline'
import { stdin as input, nextTick, stdout as output } from 'node:process'

const rl = readline.createInterface({ input, output })

const env = new Env()

for (const [key, value] of Object.entries(repl_env)) env.set(key, value)

rep(`(def! not (fn* (a) (if a false true)))`, env)

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
