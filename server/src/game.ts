import type { GameBase, State } from "@dartagnan/api/game"
import type { Player } from "#player"

// biome-ignore format: better look like a switch-case
type Props<S = State> =
    S extends "Idle" ? IdleProps :
    S extends "BetSetup" ? BetSetupProps :
    S extends "Turn" ? TurnProps :
    S extends "RoundCeremony" ? RoundCeremonyProps:
    S extends "GameOver" ? GameOverProps:
    never

type Switching<S extends State> = { switchTo(s: S): GameIn<S> }

interface Guardable {
    in<S extends State>(s: S): this is GameIn<S>
}

type IdleProps = {
    addPlayer(p: Player): void
    removePlayer(p: Player): void
} & Switching<"BetSetup">

type BetSetupProps = {
    readonly currentPlayer: Player
    bet: number | null
    readonly betWindow: readonly [number, number]
    setBet(b: number): void
} & Switching<"Turn">

type TurnProps = {
    readonly bet: number
    readonly currentPlayer: Player
    readonly richest: Player
    readonly seated: readonly Player[]
} & Switching<"Turn" | "RoundCeremony">

type RoundCeremonyProps = {
    readonly winner: Player
    readonly seated: readonly Player[]
} & Switching<"BetSetup" | "GameOver">

type GameOverProps = {
    readonly winner: Player
}

export type GameIn<S extends State> = GameBase<S> & Props<S> & Guardable

export class GameIdle implements GameIn<"Idle"> {
    state = "Idle" as const
    round: null = null
    players: Player[] = []
    switchTo(s: "BetSetup") {
        return new GameBetSetup(this)
    }
    addPlayer(p: Player) {
        this.players.push(p)
    }
    removePlayer(p: Player) {
        const i = this.players.indexOf(p)
        if (i === -1) return
        this.players.splice(i, 1)
    }
    in<S extends State>(s: S): this is GameIn<S> {
        return this.state === s
    }
}

class GameBetSetup implements GameIn<"BetSetup"> {
    readonly state = "BetSetup" as const
    readonly currentPlayer: Player
    bet: number | null = null
    readonly round: number
    readonly players: readonly Player[]
    constructor(g: GameIdle | GameRoundCeremony) {
        if (!g.players[0])
            // should never happen
            throw new Error("No players")
        this.currentPlayer = g.state === "Idle" ? g.players[0] : g.winner
        this.round = g.round ? g.round + 1 : 1
        this.players = g.players
    }
    setBet(b: number) {
        this.bet = b
    }
    switchTo(s: "Turn") {
        return new GameTurn(this)
    }
    get betWindow(): readonly [number, number] {
        return [5 * this.round, 5 * this.round + 10]
    }
    in<S extends State>(s: S): this is GameIn<S> {
        return this.state === s
    }
}

class GameRoundCeremony implements GameIn<"RoundCeremony"> {
    readonly state = "RoundCeremony" as const
    readonly winner: Player
    readonly round: number
    readonly players: readonly Player[]
    constructor(g: GameTurn) {
        if (!g.seated[0])
            // should never happen
            throw new Error("No players")
        this.winner = g.seated[0]
        this.round = g.round
        this.players = g.players
    }
    get seated(): readonly Player[] {
        return this.players.filter(p => p.seated)
    }
    switchTo(s: "BetSetup" | "GameOver") {
        if (s === "BetSetup") return new GameBetSetup(this)
        return new GameOver(this)
    }
    in<S extends State>(s: S): this is GameIn<S> {
        return this.state === s
    }
}

class GameTurn implements GameIn<"Turn"> {
    readonly state = "Turn" as const
    readonly currentPlayer: Player
    readonly bet: number
    readonly round: number
    readonly players: readonly Player[]
    constructor(g: GameBetSetup | GameTurn) {
        this.currentPlayer = g.currentPlayer
        if (!g.bet)
            // should never happen
            throw new Error("bet not set")
        this.bet = g.bet
        this.round = g.round
        this.players = g.players
    }
    get seated(): readonly Player[] {
        return this.players.filter(p => p.seated)
    }
    get richest() {
        return this.players.reduce((a, b) => (a.balance > b.balance ? a : b))
    }
    switchTo(s: "Turn" | "RoundCeremony") {
        if (s === "Turn") return new GameTurn(this)
        return new GameRoundCeremony(this)
    }
    in<S extends State>(s: S): this is GameIn<S> {
        return this.state === s
    }
}

class GameOver implements GameIn<"GameOver"> {
    readonly state = "GameOver" as const
    readonly winner: Player
    readonly players: readonly Player[]
    constructor(g: GameRoundCeremony) {
        this.winner = g.winner
        this.players = g.players
    }
    in<S extends State>(s: S): this is GameIn<S> {
        return this.state === s
    }
}
