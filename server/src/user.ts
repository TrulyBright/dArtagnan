import type { Event } from "@dartagnan/api/event"
import type { UserBase, Username } from "@dartagnan/api/user"
import { Listening } from "#listening"
import type { Player } from "#player"
import type { Room } from "#room"

export class User extends Listening<Event> implements UserBase {
    private static nextId = 0
    static readonly Q_CAPACITY = 5
    readonly id = User.nextId++
    readonly #EventQ: Event[] = []
    room: Room | null = null
    player: Player | null = null
    constructor(readonly name: Username) {
        super()
        this.addListener(e => {
            this.#EventQ.push(e)
            if (this.#EventQ.length > User.Q_CAPACITY) this.earliestEvent
        })
    }
    setRoom(r: Room) {
        this.room = r
    }
    unsetRoom() {
        this.room = null
    }
    associate(p: Player) {
        this.player = p
        for (const l of this.listeners) p.addListener(l)
    }
    disassociate() {
        for (const l of this.listeners) this.player?.removeListener(l)
        this.player = null
    }
    /** return the earliest of the last `Q_CAPACITY` events. */
    get earliestEvent() {
        return this.#EventQ.shift()
    }
    get gotNoEvent() {
        return this.earliestEvent === undefined
    }
}
