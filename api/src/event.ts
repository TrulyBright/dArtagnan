import type { Card } from "#card"
import type { GameBase } from "#game"
import type { PlayerBase } from "#player"
import type { UserBase } from "#user"

export class UserSpoke {
    constructor(
        readonly message: string,
        readonly user: UserBase,
    ) {}
}

export class UserEntered {
    constructor(readonly user: UserBase) {}
}

export class NowTurnOf {
    constructor(readonly player: PlayerBase) {}
}

export class NewRound {
    constructor(readonly round: number) {}
}

export class BetSetupStart {
    constructor(readonly player: PlayerBase) {}
}

export class BetSetupDone {
    constructor(readonly bet: number) {}
}

export class PlayerShot {
    constructor(
        readonly shooter: PlayerBase,
        readonly target: PlayerBase,
    ) {}
}

export class PlayerStatus {
    constructor(readonly player: PlayerBase) {}
}

export class YourCard {
    constructor(readonly card: Card | null) {}
}

export class PlayerDrewCard {
    constructor(readonly player: PlayerBase) {}
}

export class Countdown {
    constructor(
        readonly full: number,
        readonly remain: number,
    ) {}
}

export class RoundWinner {
    constructor(readonly player: PlayerBase) {}
}

export class GameOver {}

export class TurnOrder {
    constructor(readonly order: GameBase["turnOrder"]) {}
}

export class CardPlayed {
    constructor(readonly card: Card) {}
}

export class Stakes {
    constructor(readonly stakes: number) {}
}

const userEvents = [UserSpoke, UserEntered] as const

const playerEvents = [
    NewRound,
    NowTurnOf,
    BetSetupStart,
    BetSetupDone,
    PlayerShot,
    YourCard,
    PlayerDrewCard,
    Countdown,
    RoundWinner,
    GameOver,
    TurnOrder,
    CardPlayed,
    Stakes,
] as const

const events = [...userEvents, ...playerEvents] as const

type UserEvent = InstanceType<(typeof userEvents)[number]>

type PlayerEvent = InstanceType<(typeof playerEvents)[number]>

export type Event = UserEvent | PlayerEvent
