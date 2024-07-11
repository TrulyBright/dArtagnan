import { GameBase } from "@api/game"
import { Player } from "./player"

export class Game implements GameBase {
    readonly players: Player[] = []
    static readonly MIN_PLAYERS = 3
    private turn: Player | null = null
    addPlayer(p: Player) {
        this.players.push(p)
    }
}