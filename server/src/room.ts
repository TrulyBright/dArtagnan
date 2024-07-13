import type { Code } from "@dartagnan/api/code"
import type { Event } from "@dartagnan/api/event"
import type { State } from "@dartagnan/api/game"
import type { RoomBase } from "@dartagnan/api/room"
import type { GameIn } from "#game"
import type { User } from "#user"

export class Room implements RoomBase {
    readonly users: User[] = []
    host: User | null = null
    game: GameIn<State> | null = null
    constructor(public code: Code) {}
    get startable() {
        return this.game === null && this.users.length >= 3
    }
    get empty() {
        return this.users.length === 0
    }
    get full() {
        return this.users.length === 8
    }
    broadcast(e: Event) {
        for (const u of this.users) u.recv(e)
    }
    setHost(u: User) {
        this.host = u
    }
    addUser(u: User) {
        this.users.push(u)
        if (!this.host) this.setHost(u)
    }
    removeUser(u: User) {
        const index = this.users.indexOf(u)
        if (index === -1)
            // should never happen
            throw new Error("User not in room")
        this.users.splice(index, 1)
    }
}
