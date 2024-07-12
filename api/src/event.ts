import { PlayerBase } from "#player"
import { UserBase } from "#user"

export class UserSpoke {
    constructor(
        readonly message: string,
        readonly user: UserBase
    ) {}
}

export class UserEntered {
    constructor(readonly user: UserBase) { }
}

export class NowTurnOf {
    constructor(readonly player: PlayerBase) { }
}

const userEvents = [
    UserSpoke,
    UserEntered
] as const

const playerEvents = [
    NowTurnOf
] as const

const events = [...userEvents, ...playerEvents] as const

type UserEvent = InstanceType<typeof userEvents[number]>

type PlayerEvent = InstanceType<typeof playerEvents[number]>

export type Event = UserEvent | PlayerEvent