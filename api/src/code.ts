export type Code = string & { __brand: "Code" }
export const isCode = (s: unknown): s is Code =>
    typeof s === "string" && /^[A-Z0-9]{8}$/.test(s)
export const randomCode = (): Code => Math.random().toString(26 + 10).slice(2, 10).toUpperCase() as Code