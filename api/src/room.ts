import type { Code } from "#code"
import type { UserBase } from "#user"

export type RoomBase = {
    readonly users: UserBase[]
    host: UserBase | null
    code: Code
}
