import { Env, makeClosureEnv } from './env.js'
import { read_str } from './reader.js'
import { pr_str } from './printer.js'
import {
  repl_env,
  list,
  isList,
  isSymbol,
  vector,
  hash_map,
  symbol,
  isVector,
  isHashMap,
  isClosure,
  cloneFunction,
} from './core.js'

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

const quasiquote = ast => {
  if (ast === undefined) return null
  if (isList(ast)) {
    const elements = ast.value
    if (elements.length === 0) return ast
    if (isSymbol(elements[0]) === 'unquote' && elements.length >= 2)
      return elements[1]
    const [elt, ...elts] = elements
    if (isList(elt) && isSymbol(elt.value[0]) === 'splice-unquote') {
      return list(symbol('concat'), elt.value[1], quasiquote(list(...elts)))
    } else {
      return list(symbol('cons'), quasiquote(elt), quasiquote(list(...elts)))
    }
  } else if (isVector(ast)) {
    if (isSymbol(ast.value[0]) === 'unquote') {
      return list(
        symbol('vec'),
        list(
          symbol('cons'),
          list(symbol('quote'), symbol('unquote')),
          quasiquote(list(...ast.value.slice(1))),
        ),
      )
    } else {
      return list(symbol('vec'), quasiquote(list(...ast.value)))
    }
  }
  if (isHashMap(ast) || isSymbol(ast)) return list(symbol('quote'), ast)
  return ast
}

const isMacroCall = (ast, env) => {
  try {
    if (isList(ast)) {
      const [a] = ast.value
      return isSymbol(a) && env.get(a.value)?.isMacro
    }
  } catch (e) {
    return false
  }
  return false
}

const macroExpand = (ast, env) => {
  while (isMacroCall(ast, env)) {
    const [a, ...args] = ast.value
    const macro = env.get(a.value)
    ast = macro(...args)
  }
  return ast
}

const EVAL = (ast, env) => {
  while (true) {
    if (ast === null) return null
    if (!isList(ast)) return eval_ast(ast, env)
    if (ast.value.length === 0) return ast
    ast = macroExpand(ast, env)
    if (!isList(ast)) continue
    const [efirst, ...rest] = ast.value
    if (isSymbol(efirst)) {
      const efirstValue = efirst.value
      switch (efirstValue) {
        case 'def!':
        case 'defmacro!': {
          const [symbol, value] = rest
          let ev = EVAL(value, env)
          if (efirstValue === 'defmacro!' && typeof ev === 'function') {
            ev = cloneFunction(ev)
            ev.isMacro = true
          }
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
          ast = body
          env = newEnv
          continue
        }
        case 'do': {
          for (const x of rest.slice(0, -1)) EVAL(x, env)
          ast = rest.at(-1)
          continue
        }
        case 'if': {
          const [cond, t, f] =
            rest.length < 3 ? rest.concat(null, null, null) : rest
          const econd = EVAL(cond, env)
          ast = econd === false || econd === null ? f : t
          continue
        }
        case 'fn*': {
          const [params, body] = rest
          const closureCtor = makeClosureEnv(params, env)
          const fn = (...args) => EVAL(body, closureCtor(args))
          fn.type = 'closure'
          fn.ast = body
          fn.closureCtor = closureCtor
          return fn
        }
        case 'quote': {
          return rest[0]
        }
        case 'quasiquote': {
          ast = quasiquote(rest[0])
          continue
        }
        case 'quasiquoteexpand': {
          return quasiquote(rest[0])
        }
        case 'macroexpand': {
          return macroExpand(rest[0], env)
        }
      }
    }
    const f = EVAL(efirst, env)
    const args = rest.map(arg => EVAL(arg, env))
    if (f.type !== 'closure') return f(...args)
    ast = f.ast
    env = f.closureCtor(args)
  }
}

const PRINT = str => pr_str(str, true)

const rep = (str, env) => PRINT(EVAL(READ(str), env))

const env = new Env()

for (const [key, value] of Object.entries(repl_env)) env.set(key, value)

rep(`(def! not (fn* (a) (if a false true)))`, env)

env.set('eval', ast => EVAL(ast, env))

rep(
  `(def! load-file (fn* (f) (eval (read-string (str \"(do \" (slurp f) \"\nnil)\")))))`,
  env,
)

rep(
  '(defmacro! cond (fn* (& xs) (if (> (count xs) 0) (list \'if (first xs) (if (> (count xs) 1) (nth xs 1) (throw "odd number of forms to cond")) (cons \'cond (rest (rest xs)))))))',
  env,
)

const commandLineArgs = process.argv.slice(2)
const [first, ...rest] = commandLineArgs
env.set('*ARGV*', list(...rest))

import * as readline from 'node:readline'
import { stdin as input, nextTick, stdout as output } from 'node:process'

if (commandLineArgs.length > 0) {
  rep(`(load-file "${first}")`, env)
} else {
  const rl = readline.createInterface({ input, output })
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
}
