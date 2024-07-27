import type { UserBase, Username } from "@dartagnan/api/user"
import type { Player } from "#player"
import { EnqueueOnEvent } from "#queue"
import type { Room } from "#room"

export class User extends EnqueueOnEvent implements UserBase {
    private static nextId = 0
    readonly id = User.nextId++
    room: Room | null = null
    player: Player | null = null
    constructor(readonly name: Username) {
        super()
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
}
