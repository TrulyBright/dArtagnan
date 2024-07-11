import { Drift } from "#drift"

export type Speak = {
    readonly tag: 'Speak'
    readonly message: string
}

export type StartGame = {
    readonly tag: 'StartGame'
}

export type Shoot = {
    readonly tag: 'Shoot'
    readonly index: number
}

export type DrawCard = {
    readonly tag: 'DrawCard'
}

export type PlayCard = {
    readonly tag: 'PlayCard'
}

export type SetDrift = {
    readonly tag: 'SetDrift'
    readonly drift: Drift
}

export type UserAction = Speak | StartGame
export type PlayerAction = Shoot | DrawCard | PlayCard | SetDrift
export type Action = UserAction | PlayerAction