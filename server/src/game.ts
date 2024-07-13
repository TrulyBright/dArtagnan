import type { BetSetupDone, BetSetupStart, Event } from "@dartagnan/api/event"
import type { GameBase, State } from "@dartagnan/api/game"
import type { Listener } from "#listening"
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

type IdleProps = {
    addPlayer(p: Player): void
    removePlayer(p: Player): void
    addListener(l: Listener<Event>): void
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
} // no switching

abstract class StateBase {
    abstract readonly state: State
    abstract readonly listeners: readonly Listener<Event>[]
    in<S extends State>(s: S): this is GameIn<S> {
        return this.state === s
    }
    broadcast(e: Event): void {
        for (const l of this.listeners) l(e)
    }
}

export type GameIn<S extends State> = GameBase<S, Player> & Props<S> & StateBase

export class GameIdle extends StateBase implements GameIn<"Idle"> {
    state = "Idle" as const
    round: null = null
    private readonly _players: Player[] = []
    get players(): readonly Player[] {
        return this._players
    }
    readonly listeners: Listener<Event>[] = []
    addListener(l: Listener<Event>): void {
        this.listeners.push(l)
    }
    switchTo(s: "BetSetup") {
        return new GameBetSetup(this)
    }
    addPlayer(p: Player) {
        this._players.push(p)
    }
    removePlayer(p: Player) {
        const i = this._players.indexOf(p)
        if (i === -1) return
        this._players.splice(i, 1)
    }
}

class GameBetSetup extends StateBase implements GameIn<"BetSetup"> {
    readonly state = "BetSetup" as const
    readonly currentPlayer: Player
    bet: number | null = null
    readonly round: number
    readonly players: readonly Player[]
    readonly listeners: readonly Listener<Event>[]
    constructor(g: GameIdle | GameRoundCeremony) {
        super()
        this.currentPlayer = g.state === "Idle" ? g.players[0] : g.winner
        this.round = g.round ? g.round + 1 : 1
        this.players = g.players
        this.listeners = g.listeners
    }
    get betWindow(): readonly [number, number] {
        return [5 * this.round, 5 * this.round + 10]
    }
    setBet(b: number) {
        this.bet = b
    }
    switchTo(s: "Turn") {
        return new GameTurn(this)
    }
}

class GameRoundCeremony extends StateBase implements GameIn<"RoundCeremony"> {
    readonly state = "RoundCeremony" as const
    readonly winner: Player
    readonly round: number
    readonly players: readonly Player[]
    readonly listeners: readonly Listener<Event>[]
    constructor(g: GameTurn) {
        super()
        this.winner = g.seated[0]
        this.round = g.round
        this.players = g.players
        this.listeners = g.listeners
    }
    get seated(): readonly Player[] {
        return this.players.filter(p => p.seated)
    }
    switchTo(s: "BetSetup" | "GameOver") {
        if (s === "BetSetup") return new GameBetSetup(this)
        return new GameOver(this)
    }
}

class GameTurn extends StateBase implements GameIn<"Turn"> {
    readonly state = "Turn" as const
    readonly currentPlayer: Player
    readonly bet: number
    readonly round: number
    readonly players: readonly Player[]
    readonly listeners: readonly Listener<Event>[]
    constructor(g: GameBetSetup | GameTurn) {
        super()
        if (!g.bet)
            // should never happen
            throw new Error(
                "bet not set. Switch to BetSetup first to set the bet.",
            )
        this.bet = g.bet
        this.round = g.round
        this.players = g.players
        this.listeners = g.listeners
        this.currentPlayer =
            g.state === "BetSetup"
                ? g.currentPlayer
                : this.seated[
                      (this.seated.indexOf(g.currentPlayer) + 1) %
                          this.seated.length
                  ] // next player
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
}

class GameOver extends StateBase implements GameIn<"GameOver"> {
    readonly state = "GameOver" as const
    readonly winner: Player
    readonly players: readonly Player[]
    readonly listeners: readonly Listener<Event>[]
    constructor(g: GameRoundCeremony) {
        super()
        this.winner = g.winner
        this.players = g.players
        this.listeners = g.listeners
    }
}
