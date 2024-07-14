export type Code = string & { __brand: "Code" }
export const isCode = (s: unknown): s is Code =>
    typeof s === "string" && CodeRegex.test(s)
export const CodeRegex = /^[A-Z0-9]{8}$/
export const randomCode = (): Code =>
    Math.random()
        .toString(26 + 10)
        .slice(2, 10)
        .toUpperCase() as Code
