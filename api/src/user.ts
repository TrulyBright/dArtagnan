export type UserBase = {
    readonly id: number
    readonly name: Username
}

export type Username = string & { __brand: "username" }
export const isUsername = (s: unknown): s is Username =>
    typeof s === "string" && UsernameRegex.test(s)
export const UsernameRegex = /^.{1,8}$/
