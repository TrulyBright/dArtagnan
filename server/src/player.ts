import type { Event } from "@dartagnan/api/event"
import type { State } from "@dartagnan/api/game"
import type { PlayerBase } from "@dartagnan/api/player"
import type { GameIn } from "#game"
import { Listening } from "#listening"
import { BuffStatusReset } from "@dartagnan/api/card"

export class Player extends Listening<Event> implements PlayerBase {
    game: GameIn<State> | null = null
    constructor(readonly index: number) {
        super()
    }
    buff = BuffStatusReset
    seated = true
    balance = 200
    accuracy = Math.random()
    join(g: GameIn<"Idle">) {
        this.game = g
    }
    leave() {
        this.game = null
    }
}
