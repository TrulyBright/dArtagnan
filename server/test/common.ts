import { User } from "#user"
import { Username, isUsername } from "@dartagnan/api/user"

export const unameGen = (): Username => {
    const s = Math.floor(Math.random() * 100).toString(36)
    if (isUsername(s)) return s
    throw new Error(`Invalid Username: ${s}`)
}

export const uGen = () => new User(unameGen())