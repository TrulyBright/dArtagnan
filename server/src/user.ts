import { UserBase, Username } from "@dartagnan/api/user"
import { Room } from "#room"
import { Event } from "@dartagnan/api/event"
import { Listening } from "#listening"
import { Player } from "#player"

export class User extends Listening<Event> implements UserBase {
    private static nextId = 0
    readonly id = User.nextId++
    room: Room | null = null
    player: Player | null = null
    constructor(readonly name: Username) { super() }
}