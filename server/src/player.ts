import { PlayerBase } from "@dartagnan/api/player"
import { GameIn } from "#game"
import { Listening } from "#listening"
import { Event } from "@dartagnan/api/event"
import { State } from "@dartagnan/api/game"

export class Player extends Listening<Event> implements PlayerBase {
    game: GameIn<State> | null = null
    constructor(readonly index: number) { super() }
    seated = true
    join(g: GameIn<'Idle'>) {
        this.game = g
    }
    leave() {
        this.game = null
    }
}