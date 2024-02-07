const regex =
  /[\s,]*(~@|[\[\]{}()'`~^@]|"(?:\\.|[^\\"])*"?|;.*|[^\s\[\]{}('"`,;)]*)/g

const tokenize = str =>
  [...str.matchAll(regex)].map(m => m[1]).filter(s => s.length > 0)

const make_symbol = s => ({ type: 'symbol', value: s })

export const keyword = s => ({ type: 'keyword', value: s })

const read_atom = s => {
  switch (s) {
    case 'nil':
      return null
    case 'false':
      return false
    case 'true':
      return true
    default:
      if (s.match(/^-?[0-9]+$/)) return parseInt(s)
      // else if (s.match(/^-?[0-9][0-9.]*$/)) return parseFloat(s);
      return make_symbol(s)
  }
}

const make_reader = tokens => {
  let position = 0
  return {
    peek: () => (position >= tokens.length ? null : tokens[position]),
    next: () => {
      position++
      return null
    },
  }
}

export const list = (...args) => ({ type: 'list', value: args })

export const vector = (...args) => ({ type: 'vector', value: args })

export const hash_map = (...args) => ({ type: 'hash-map', value: args })

export const apply = (f, array) => f.apply(null, array)

const unescapeMap = {
  '"': '"',
  n: '\n',
  '\\': '\\',
}

const unescape = s => {
  const result = []
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '\\') {
      i++
      if (i === s.length) throw new Error('unbalanced quotes in string')
      const escape = unescapeMap[s[i]]
      if (!escape) throw new Error(`unexpected escape character: \\${s[i]}`)
      result.push(escape)
    } else {
      result.push(s[i])
    }
  }
  return result.join('')
}

const read_form = reader => {
  const token = reader.peek()
  reader.next()
  switch (token) {
    case '(':
      return apply(list, read_list(reader, ')'))
    case '[':
      return apply(vector, read_list(reader, ']'))
    case '{':
      return apply(hash_map, read_list(reader, '}'))
    case ')':
    case '}':
    case ']':
      throw new Error("unexpected ')'")
    case "'":
      return list(make_symbol('quote'), read_form(reader))
    case '`':
      return list(make_symbol('quasiquote'), read_form(reader))
    case '~':
      return list(make_symbol('unquote'), read_form(reader))
    case '~@':
      return list(make_symbol('splice-unquote'), read_form(reader))
    case '@':
      return list(make_symbol('deref'), read_form(reader))
    case '^': {
      const form = read_form(reader)
      const meta = read_form(reader)
      return list(make_symbol('with-meta'), meta, form)
    }
    default:
      switch (token[0]) {
        case '"': {
          if (token.length === 1) throw new Error('unbalanced quotes in string')
          if (token.at(-1) !== '"')
            throw new Error('unbalanced quotes in string')
          return unescape(token.substring(1, token.length - 1))
        }
        case ':':
          return keyword(token.substring(1))
        default:
          return read_atom(token)
      }
  }
}

const read_list = (reader, stopChar) => {
  const list = []
  let p
  while ((p = reader.peek()) !== null && p !== stopChar) {
    list.push(read_form(reader))
  }
  if (p === null) throw new Error("expected ')', got EOF")
  reader.next()
  return list
}

export const read_str = str => {
  const tokens = tokenize(str)
  const reader = make_reader(tokens)
  return read_form(reader)
}
