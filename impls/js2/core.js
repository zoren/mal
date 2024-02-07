import { pr_str } from './printer.js'

const isPrimitive = v => {
  if (v === null) return true
  const t = typeof v
  return t === 'number' || t === 'string' || t === 'boolean'
}

export const list = (...args) => ({ type: 'list', value: args })

export const isList = ast =>
  ast !== null &&
  typeof ast === 'object' &&
  typeof ast.type === 'string' &&
  ast.type === 'list'
export const isVector = ast =>
  ast !== null &&
  typeof ast === 'object' &&
  typeof ast.type === 'string' &&
  ast.type === 'vector'

export const isSymbol = ast => ast.type === 'symbol'
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
  count: a => (isList(a) || isVector(a) ? a.value.length : 0),
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
}
