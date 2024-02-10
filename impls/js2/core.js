import fs from 'node:fs'
import { pr_str } from './printer.js'
import { read_str } from './reader.js'
import { question } from 'readline-sync'

const isPrimitive = v => {
  if (v === null) return true
  const t = typeof v
  return t === 'number' || t === 'string' || t === 'boolean' || t === 'symbol'
}

const makeRuntimeValue =
  type =>
  (...args) =>
    Object.freeze({ type, value: args })

export const list = (...args) => ({ type: 'list', value: args })

export const vector = (...args) => ({ type: 'vector', value: args })

export const hash_map = (...args) => {
  const value = new Map()
  for (let i = 0; i < args.length; i += 2) value.set(args[i], args[i + 1])
  return { type: 'hash-map', value }
}

export const hasTag = tag => ast =>
  ast !== null && typeof ast === 'object' && ast.type === tag

export const isList = hasTag('list')

export const isVector = hasTag('vector')

export const isHashMap = hasTag('hash-map')

export const isClosure = hasTag('closure')

const getFn = fOrC => (isClosure(fOrC) ? fOrC.fn : fOrC)

const isKeyword = ast => typeof ast === 'symbol'

export const isSymbol = ast =>
  ast !== null && typeof ast === 'object' && ast.type === 'symbol'
    ? ast.value
    : null

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
    if (isHashMap(a) && isHashMap(b)) {
      if (a.value.size !== b.value.size) return false
      for (const [k, v] of a.value) if (!equal(v, b.value.get(k))) return false
      return true
    }
    return a.value === b.value
  }
  return true
}

export const cons = (e, l) => list(e, ...l.value)

export const concat = (...args) => {
  const result = []
  for (const arg of args) {
    if (arg === null) continue
    if (isSeq(arg)) result.push(...arg.value)
    else result.push(arg)
  }
  return list(...result)
}

export const symbol = s => ({ type: 'symbol', value: s })

export const keyword = s => (typeof s === 'symbol' ? s : Symbol.for(s))

export class MalError extends Error {
  constructor(value) {
    super('mal error')
    this.value = value
  }
}

export const repl_env = {
  '+': (a, b) => a + b,
  '-': (a, b) => a - b,
  '*': (a, b) => a * b,
  '/': (a, b) => (a / b) | 0,

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
  'read-string': str => {
    try {
      return read_str(str)
    } catch (e) {
      throw new MalError(e.message)
    }
  },
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
  vec: l => vector(...l.value),
  nth: (l, n) => {
    if (isSeq(l) && n < l.value.length) return l.value[n]
    throw new MalError('Index out of bounds')
  },
  first: l => (isSeq(l) && l.value.length > 0 ? l.value[0] : null),
  rest: l =>
    isSeq(l) && l.value.length > 0 ? list(...l.value.slice(1)) : list(),
  throw: value => {
    throw new MalError(value)
  },
  apply: (f, ...args) => {
    const butLast = args.slice(0, -1)
    const last = args.at(-1)
    return getFn(f)(...butLast, ...last.value)
  },
  map: (f, l) => list(...l.value.map(v => getFn(f)(v))),
  'nil?': v => v === null,
  'true?': v => v === true,
  'false?': v => v === false,
  'symbol?': v => isSymbol(v) !== null,

  symbol,
  keyword,
  'keyword?': isKeyword,
  vector,
  'vector?': isVector,
  'sequential?': isSeq,
  'hash-map': hash_map,
  'map?': isHashMap,
  assoc: (h, ...kvs) => {
    const value = new Map(h.value)
    for (let i = 0; i < kvs.length; i += 2) {
      value.set(kvs[i], kvs[i + 1])
    }
    return { type: 'hash-map', value }
  },
  dissoc: (h, ...keys) => {
    const value = new Map(h.value)
    for (const key of keys) value.delete(key)
    return { type: 'hash-map', value }
  },
  get: (h, k) => (isHashMap(h) && h.value.has(k) ? h.value.get(k) : null),
  'contains?': (h, k) => h.value.has(k),
  keys: h => list(...h.value.keys()),
  vals: h => list(...h.value.values()),

  readline: question,
  '*host-language*': 'js2',
  'time-ms': () => Date.now(),
  meta: o => o.meta || null,
  'with-meta': (o, meta) => {
    if (typeof o === 'function') {
      const newF = o.bind(null)
      newF.meta = meta
      return newF
    }
    const newO = { ...o, meta }
    return newO
  },
  'fn?': o => {
    if (typeof o === 'function') return true
    if (isClosure(o)) return !o.isMacro
    return false
  },
  'macro?': o => {
    if (typeof o === 'function') return false
    if (isClosure(o)) return !!o.isMacro
    return false
  },
  'string?': o => typeof o === 'string',
  'number?': o => typeof o === 'number',
  seq: coll => {
    if (typeof coll === 'string')
      return coll.length === 0 ? null : list(...coll)
    if (isSeq(coll)) {
      if (coll.value.length === 0) return null
      return list(...coll.value)
    }
    return null
  },
  conj: (o, ...items) => {
    switch (o.type) {
      case 'list': {
        items.reverse()
        return list(...items, ...o.value)
      }
      case 'vector':
        return vector(...o.value, ...items)
      default:
        return null
    }
  },
}
