import fs from 'node:fs'
import { pr_str } from './printer.js'
import { read_str } from './reader.js'

const isPrimitive = v => {
  if (v === null) return true
  const t = typeof v
  return t === 'number' || t === 'string' || t === 'boolean'
}

const makeRuntimeValue = (type) => (...args) => Object.freeze({ type, value: args })

export const list = (...args) => ({ type: 'list', value: args })

export const vector = (...args) => ({ type: 'vector', value: args })

export const hash_map = (...args) => ({ type: 'hash-map', value: args })

export const hasTag = (tag) => (ast) => ast !== null && typeof ast === 'object' && ast.type === tag

export const isList = hasTag('list')

export const isVector = hasTag('vector')

export const isHashMap = hasTag('hash-map')

export const isSymbol = (ast) => (ast !== null && typeof ast === 'object' && ast.type === 'symbol') ? ast.value : null

const isSeq = ast => isList(ast) || isVector(ast)

const equal = (a, b) => {
  if (a === b) return true
  if (isPrimitive(a) || isPrimitive(b)) return false
  if (typeof a === 'object' && typeof b === 'object') {
    if (isSeq(a) && isSeq(b)) {
      if (a.value.length !== b.value.length) return false
      for (let i = 0; i < a.value.length; i++) {
        if (!equal(a.value[i], b.value[i])) return false
      }
      return true
    }
    if (a.type !== b.type) return false
    return a.value === b.value
  }
  return true
}

export const cons = (e, l) => list(e, ...l.value)

export const concat = (...args) => {
  const result = []
  for(const arg of args) {
    if (arg === null) continue
    if (isSeq(arg)) result.push(...arg.value)
    else result.push(arg)
  }
  return list(...result)
}

export const symbol = s => ({ type: 'symbol', value: s })

export const repl_env = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => (a / b) | 0,

  prn: v => {
    console.log(pr_str(v, true))
    return null
  },
  list,
  'list?': isList,
  'empty?': a => a.value.length === 0,
  count: a => (isSeq(a) ? a.value.length : 0),
  '=': equal,
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
  '>': (a, b) => a > b,
  '>=': (a, b) => a >= b,

  'pr-str': (...args) => args.map(a => pr_str(a, true)).join(' '),
  str: (...args) => args.map(a => pr_str(a, false)).join(''),
  prn: (...args) => {
    console.log(args.map(a => pr_str(a, true)).join(' '))
    return null
  },
  println: (...args) => {
    console.log(args.map(a => pr_str(a, false)).join(' '))
    return null
  },
  'read-string': str => read_str(str),
  slurp: filepath => fs.readFileSync(filepath, 'utf-8'),
  atom: v => ({ type: 'atom', value: v }),
  'atom?': v => v.type === 'atom',
  deref: v => v.value,
  'reset!': (atom, v) => {
    atom.value = v
    return v
  },
  cons,
  concat,
  vec: (l) => vector(...l.value),
  // 'swap!': (atom, f, ...args) => {
  //   atom.value = f(atom.value, ...args)
  //   return atom.value
  // },
}
