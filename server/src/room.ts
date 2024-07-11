import { RoomBase } from "@api/room"
import { Code } from "@api/code"
import { Event } from "@api/event"
import { User } from "./user"
import { Game } from "./game"

export class Room implements RoomBase {
    readonly users: User[] = []
    host: User | null = null
    game: Game | null = null
    constructor(public code: Code) { }
    get startable() {
        return this.users.length >= Game.MIN_PLAYERS
    }
    broadcast(e: Event) {
        this.users.forEach(u => u.recv(e))
    }
    startGame() {
        // TODO
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