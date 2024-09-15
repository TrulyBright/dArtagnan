import type { Card } from "#card"
import type { GameBase } from "#game"
import type { PlayerBase } from "#player"
import type { UserBase } from "#user"

export type UserSpoke = {
    readonly tag: "UserSpoke"
    readonly message: string
    readonly user: UserBase
}

export type UserEntered = {
    readonly tag: "UserEntered"
    readonly user: UserBase
}

export type NewHost = {
    readonly tag: "NewHost"
    readonly host: UserBase
}

export type UserLeft = {
    readonly tag: "UserLeft"
    readonly user: UserBase
}

export type NowTurnOf = {
    readonly tag: "NowTurnOf"
    readonly player: PlayerBase
}

export type NewRound = {
    readonly tag: "NewRound"
    readonly round: number
}

export type BetSetupStart = {
    readonly tag: "BetSetupStart"
    readonly player: PlayerBase
}

export type BetSetupDone = {
    readonly tag: "BetSetupDone"
    readonly bet: number
}

export type PlayerShot = {
    readonly tag: "PlayerShot"
    readonly shooter: PlayerBase
    readonly target: PlayerBase
}

export type PlayerStatus = {
    readonly tag: "PlayerStatus"
    readonly player: PlayerBase
}

export type YourCard = {
    readonly tag: "YourCard"
    readonly card: Card | null
}

export type PlayerDrewCard = {
    readonly tag: "PlayerDrewCard"
    readonly player: PlayerBase
}

export type Countdown = {
    readonly tag: "Countdown"
    readonly full: number
    readonly remain: number
}

export type RoundWinner = {
    readonly tag: "RoundWinner"
    readonly player: PlayerBase
}

export type GameOver = {
    readonly tag: "GameOver"
}

export type TurnOrder = {
    readonly tag: "TurnOrder"
    readonly order: GameBase["turnOrder"]
}

export type CardPlayed = {
    readonly tag: "CardPlayed"
    readonly card: Card
}

export type Stakes = {
    readonly tag: "Stakes"
    readonly stakes: number
}

export type Event =
    | UserSpoke
    | UserEntered
    | NewHost
    | UserLeft
    | NowTurnOf
    | NewRound
    | BetSetupStart
    | BetSetupDone
    | PlayerShot
    | PlayerStatus
    | YourCard
    | PlayerDrewCard
    | Countdown
    | RoundWinner
    | GameOver
    | TurnOrder
    | CardPlayed
    | Stakes
