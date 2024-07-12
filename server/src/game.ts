import { Player } from "#player"
import { GameBase, State } from "@dartagnan/api/game"

type Props<S = State> =
    S extends 'Idle' ? IdleProps :
    S extends 'BetSetup' ? BetSetupProps :
    S extends 'Turn' ? TurnProps :
    S extends 'RoundCeremony' ? RoundCeremonyProps :
    S extends 'GameOver' ? GameOverProps :
    never

type Switching<S extends State> = { switchTo(s: S): GameIn<S> }

type IdleProps = {
    addPlayer(p: Player): void
    removePlayer(p: Player): void
} & Switching<'BetSetup'>

type BetSetupProps = {
    readonly currentPlayer: Player
    bet: number | null
    readonly betWindow: readonly [number, number]
    setBet(b: number): void
} & Switching<'Turn'>

type TurnProps = {
    bet: number
    readonly currentPlayer: Player
} & Switching<'Turn' | 'RoundCeremony'>

type RoundCeremonyProps = {
    readonly winner: Player
} & Switching<'BetSetup' | 'GameOver'>

type GameOverProps = {
    readonly winner: Player
} // No switch

export type GameIn<S extends State> = GameBase<S> & Props<S>
// @ts-expect-error
export const isGameIn = <S extends State>(g: Player['game'], s: S): g is GameIn<S> => (
    g?.state === s
)

export class GameIdle implements GameIn<'Idle'> {
    state: 'Idle' = 'Idle'
    round: null = null
    players: Player[] = []
    switchTo(s: 'BetSetup') {
        return new GameBetSetup(this)
    }
    addPlayer(p: Player) {
        this.players.push(p)
        p.join(this)
    }
    removePlayer(p: Player) {
        const i = this.players.indexOf(p)
        if (i === -1) return
        this.players.splice(i, 1)
        p.leave()
    }
}

class GameBetSetup implements GameIn<'BetSetup'> {
    readonly state: 'BetSetup' = 'BetSetup'
    readonly currentPlayer: Player
    bet: number | null = null
    readonly round: number
    readonly players: readonly Player[]
    constructor(g: GameIdle | GameRoundCeremony) {
        this.currentPlayer = g.players[0]!
        this.round = g.round ? g.round + 1 : 1
        this.players = g.players
    }
    setBet(b: number) {
        this.bet = b
    }
    switchTo(s: 'Turn') {
        return new GameTurn(this)
    }
    get betWindow(): readonly [number, number] {
        return [5 * this.round, 5 * this.round + 10]
    }
}

class GameRoundCeremony implements GameIn<'RoundCeremony'> {
    readonly state: 'RoundCeremony' = 'RoundCeremony'
    readonly winner: Player
    readonly round: number
    readonly players: readonly Player[]
    constructor(g: GameTurn) {
        this.winner = g.players[0]!
        this.round = g.round
        this.players = g.players
    }
    switchTo(s: 'BetSetup' | 'GameOver') {
        if (s === 'BetSetup') return new GameBetSetup(this)
        return new GameOver(this)
    }
}

class GameTurn implements GameIn<'Turn'> {
    readonly state: 'Turn' = 'Turn'
    readonly currentPlayer: Player
    readonly bet: number
    readonly round: number
    readonly players: readonly Player[]
    constructor(g: GameBetSetup | GameTurn) {
        this.currentPlayer = g.currentPlayer
        this.bet = g.bet!
        this.round = g.round
        this.players = g.players
    }
    switchTo(s: 'Turn' | 'RoundCeremony') {
        if (s === 'Turn') return new GameTurn(this)
        return new GameRoundCeremony(this)
    }
}

class GameOver implements GameIn<'GameOver'> {
    readonly state: 'GameOver' = 'GameOver'
    readonly winner: Player
    readonly players: readonly Player[]
    constructor(g: GameRoundCeremony) {
        this.winner = g.winner
        this.players = g.players
    }
}