import { PlayerBase } from "@dartagnan/api/player"
import { Game } from "#game"
import { Listening } from "#listening"

export class Player extends Listening<Event> implements PlayerBase {
    game: Game | null = null
    constructor(readonly index: number) { super() }
    join(g: Game) {
        this.game = g
    }
    leave() {
        this.game = null
    }
}