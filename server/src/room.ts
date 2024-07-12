import { RoomBase } from "@dartagnan/api/room"
import { Code } from "@dartagnan/api/code"
import { Event } from "@dartagnan/api/event"
import { User } from "#user"
import { GameIn } from "#game"
import { State } from "@dartagnan/api/game"

export class Room implements RoomBase {
    readonly users: User[] = []
    host: User | null = null
    game: GameIn<State> | null = null
    constructor(public code: Code) { }
    get startable() {
        return this.game === null && this.users.length >= 3
    }
    broadcast(e: Event) {
        this.users.forEach(u => u.recv(e))
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
        if (index === -1) // should never happen
            throw new Error("User not in room")
        this.users.splice(index, 1)
    }
}