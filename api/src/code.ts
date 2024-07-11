export type Code = string & { __brand: 'Code' }
export const isCode = (s: unknown): s is Code => typeof s === 'string' && /^[A-Z0-9]{8}$/.test(s)