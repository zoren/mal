import { MalError, list } from './core.js'

export class Env {
  constructor(outer = null) {
    this.outer = outer
    this.data = {}
  }

  set(key, value) {
    this.data[key] = value
  }

  find(key) {
    if (key in this.data) return this
    if (this.outer) return this.outer.find(key)
    throw new MalError(`'${key}' not found`)
  }

  get(key) {
    return this.find(key).data[key]
  }
}

export const makeClosureEnv = (params, env) => {
  const ampIndex = params.value.findIndex(p => p.value === '&')
  const regParamEnd = ampIndex === -1 ? params.value.length : ampIndex
  const restParam = ampIndex === -1 ? null : params.value[ampIndex + 1]
  return args => {
    const newEnv = new Env(env)
    for (let i = 0; i < regParamEnd; i++)
      newEnv.set(params.value[i].value, args[i])
    if (restParam) newEnv.set(restParam.value, list(...args.slice(regParamEnd)))
    return newEnv
  }
}
