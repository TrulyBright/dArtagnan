import type { Drift } from "#drift"

export type Speak = {
    readonly tag: "Speak"
    readonly message: string
}

export type StartGame = {
    readonly tag: "StartGame"
}

export type SetBet = {
    readonly tag: "SetBet"
    readonly amount: number
}

export type Shoot = {
    readonly tag: "Shoot"
    readonly index: number
}

export type DrawCard = {
    readonly tag: "DrawCard"
}

export type PlayCard = {
    readonly tag: "PlayCard"
}

export type SetDrift = {
    readonly tag: "SetDrift"
    readonly drift: Drift
}

export type UserCmd = Speak | StartGame
export type PlayerCmd = SetBet | Shoot | DrawCard | PlayCard | SetDrift
export type Cmd = UserCmd | PlayerCmd
