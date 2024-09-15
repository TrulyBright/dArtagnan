import type { Code } from "@dartagnan/api/code"
import type { Event } from "@dartagnan/api/event"
import type { RoomBase } from "@dartagnan/api/room"
import { Game } from "#game"
import { Player } from "#player"
import type { User } from "#user"

export class Room implements RoomBase {
    static readonly MAX_MEMBERS = 8
    readonly users: User[] = []
    host: User | null = null
    private game: Game | null = null
    constructor(public code: Code) {}
    get playing() {
        return this.game !== null
    }
    get startable() {
        return !this.playing && this.users.length >= Game.MIN_PLAYERS
    }
    get empty() {
        return this.users.length === 0
    }
    get full() {
        return this.users.length >= Room.MAX_MEMBERS
    }
    broadcast(e: Event) {
        for (const u of this.users) u.recv(e)
    }
    setHost(u: User) {
        this.host = u
        this.broadcast({ tag: "NewHost", host: u })
    }
    addUser(u: User) {
        this.users.push(u)
        this.broadcast({ tag: "UserEntered", user: u })
    }
    removeUser(u: User) {
        const index = this.users.indexOf(u)
        if (index === -1)
            // should never happen
            throw new Error("User not in room")
        this.users.splice(index, 1)
        this.broadcast({ tag: "UserLeft", user: u })
    }
    speak(speaker: User, message: string) {
        this.broadcast({ tag: "UserSpoke", user: speaker, message: message })
    }
    startGame() {
        const g = new Game()
        this.users.forEach((u, i) => {
            const p = new Player(i, g)
            g.addPlayer(p)
            u.associate(p)
        })
        this.game = g
        // The game will broadcast events to everyone in the room
        // so that spectators can also observe them.
        g.addbroadcaster(this.broadcast.bind(this))
    }
}
