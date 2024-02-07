const escapeMapping = {
  '\n': 'n',
  '\\': '\\',
  '"': '"',
}

const escape = (s) => {
  const result = []
  for (const c of s) {
    const escape = escapeMapping[c]
    if (escape) {
      result.push(`\\${escape}`)
    } else {
      result.push(c)
    }
  }
  return result.join('')
}

export const pr_str = form => {
  switch (form) {
    case null:
      return 'nil'
    case false:
      return 'false'
    case true:
      return 'true'
  }
  if (typeof form === 'number') return form.toString()
  if (typeof form === 'string') return `"${escape(form)}"`
  if (typeof form === 'function') return `#<function>`
  const type = form.type
  switch (type) {
    case 'symbol':
      return form.value
    case 'keyword':
      return `:${form.value}`
    case 'list':
      return `(${form.value.map(pr_str).join(' ')})`
    case 'vector':
      return `[${form.value.map(pr_str).join(' ')}]`
    case 'hash-map':
      return `{${form.value.map(pr_str).join(' ')}}`
  }
  if (type) throw new Error(`unhandled type tag: ${type}`)
  throw new Error(`unhandled type: ${form}`)
}
