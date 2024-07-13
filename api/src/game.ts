import type { PlayerBase } from "#player"

export type State = "Idle" | "BetSetup" | "Turn" | "RoundCeremony" | "GameOver"

export type GameBase<S extends State, P extends PlayerBase> = {
    state: S
    readonly players: readonly P[]
}
