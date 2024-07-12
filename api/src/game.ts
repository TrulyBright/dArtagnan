import type { PlayerBase } from "#player"

export type State = "Idle" | "BetSetup" | "Turn" | "RoundCeremony" | "GameOver"

export type GameBase<S extends State> = {
    state: S
    readonly players: readonly PlayerBase[]
}
