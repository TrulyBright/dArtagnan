import type { PlayerBase } from "#player"

export type GameBase = {
    readonly players: readonly PlayerBase[]
    readonly seated: readonly PlayerBase[]
    readonly round: number
    readonly turnOrder: 1 | -1
    readonly currentPlayer: PlayerBase | null
    readonly bet: number
    readonly stakes: number
}

export type State =
    | "Idle"
    | "RoundInit"
    | "BetSetup"
    | "Turn"
    | "RoundCeremony"
    | "GameOver"
