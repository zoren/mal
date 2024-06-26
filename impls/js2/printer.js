const escapeMapping = {
  '\n': 'n',
  '\\': '\\',
  '"': '"',
}

const escape = s => {
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

export const pr_str = (form, printReadably) => {
  const go = form => {
    switch (form) {
      case null:
        return 'nil'
      case false:
        return 'false'
      case true:
        return 'true'
    }
    if (typeof form === 'number') return form.toString()
    if (typeof form === 'string') {
      if (printReadably) return `"${escape(form)}"`
      return form
    }
    if (typeof form === 'function') return `#<function>`
    if (typeof form === 'symbol') return `:${Symbol.keyFor(form)}`
    const type = form.type
    switch (type) {
      case 'symbol':
        return form.value
      case 'list':
        return `(${form.value.map(go).join(' ')})`
      case 'vector':
        return `[${form.value.map(go).join(' ')}]`
      case 'hash-map':
        return `{${[...form.value.entries()].map(([k, v])=>`${go(k)} ${go(v)}`).join(' ')}}`
      case 'closure':
        return `#<function>`
      case 'atom':
        return `(atom ${go(form.value)})`
    }
    if (type) throw new Error(`unhandled type tag: ${type}`)
    throw new Error(`unhandled type: ${form}`)
  }
  return go(form)
}
