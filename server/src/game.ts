import { Player } from "#player"
import { GameBase } from "@dartagnan/api/game"

export class Game implements GameBase {
    static readonly MIN_PLAYERS = 3
    readonly players: Player[] = []
    addPlayer(p: Player) {
        this.players.push(p)
    }
}