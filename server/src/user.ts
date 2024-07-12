import type { Event } from "@dartagnan/api/event"
import type { UserBase, Username } from "@dartagnan/api/user"
import { Listening } from "#listening"
import type { Player } from "#player"
import type { Room } from "#room"

export class User extends Listening<Event> implements UserBase {
    private static nextId = 0
    readonly id = User.nextId++
    room: Room | null = null
    player: Player | null = null
    constructor(readonly name: Username) {
        super()
    }
    associate(p: Player) {
        this.player = p
        for (const l of this.listeners) p.addListener(l)
    }
    disassociate() {
        for (const l of this.listeners) this.player?.removeListener(l)
        this.player = null
    }
}
