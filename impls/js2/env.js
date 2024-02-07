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
    throw new Error(`'${key}' not found`)
  }

  get(key) {
    return this.find(key).data[key]
  }
}