import { type Event } from "@dartagnan/api/event"

export class Endpoint {
    private readonly observers: Record<Event["tag"], Observer[]> = {
        UserSpoke: [],
        UserEntered: [],
        NewHost: [],
        UserLeft: [],
        NowTurnOf: [],
        NewRound: [],
        BetSetupStart: [],
        BetSetupDone: [],
        PlayerShot: [],
        PlayerStatus: [],
        YourCard: [],
        PlayerDrewCard: [],
        Countdown: [],
        RoundWinner: [],
        GameOver: [],
        TurnOrder: [],
        CardPlayed: [],
        Stakes: []
    }
    recv(e: Event) {
        for (const o of this.observers[e.tag])
            o.notify(e)
    }
    sub(tag: Event["tag"], o: Observer) {
        this.observers[tag].push(o)
    }
    unsub(tag: Event["tag"], o: Observer) {
        const i = this.observers[tag].indexOf(o)
        if (i !== -1) this.observers[tag].splice(i, 1)
    }
}

export type Observer = {
    notify(e: Event): void
}