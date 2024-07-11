import { Code } from "./code"
import { UserBase } from "./user"

export type RoomBase = {
    readonly users: UserBase[]
    host: UserBase | null
    code: Code
}