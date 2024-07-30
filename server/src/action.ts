import type {
    Action,
    DrawCard,
    PlayCard,
    SetBet,
    SetDrift,
    Shoot,
    Speak,
    StartGame,
    UserAction,
} from "@dartagnan/api/action"
import type { Drift } from "@dartagnan/api/drift"
import { NeedToBeHost, Unstartable } from "@dartagnan/api/error"
import type { Player } from "#player"
import type { User } from "#user"

type ActorByAction<A extends Action> = A extends UserAction ? User : Player

type Cmd<A extends Action> = {
    exec(a: ActorByAction<A>): void
    readonly isUserCmd: A extends UserAction ? true : false
} & A

class CSpeak implements Cmd<Speak> {
    readonly tag = "Speak"
    constructor(readonly message: string) {
        this.message = this.message.slice(0, 80).trim()
    }
    readonly isUserCmd = true
    exec(a: User): void {
        if (!this.message) return
        a.room?.speak(a, this.message)
    }
}

class CStartGame implements Cmd<StartGame> {
    readonly isUserCmd = true
    readonly tag = "StartGame"
    exec(a: User): void {
        if (a.room?.host !== a) throw new NeedToBeHost()
        if (!a.room.startable) throw new Unstartable()
        a.room.startGame()
    }
}

class CSetBet implements Cmd<SetBet> {
    readonly isUserCmd = false
    readonly tag = "SetBet"
    constructor(readonly amount: number) {}
    exec(a: Player): void {
        if (a.game?.state !== "BetSetup") return
        if (a.game.currentPlayer !== a) return
        if (!Number.isSafeInteger(this.amount)) return
        if (this.amount < a.game.betWindow[0]) return
        if (this.amount > a.game.betWindow[1]) return
        a.game.setBet(this.amount)
    }
}

class CShoot implements Cmd<Shoot> {
    readonly tag = "Shoot"
    constructor(readonly index: number) {}
    readonly isUserCmd = false
    exec(a: Player): void {
        if (a.game?.state === "Turn") return
        if (a.game?.currentPlayer !== a) return
        const target = a.game.players.at(this.index)
        if (!target) return
        if (target === a) return
        a.game.shoot(a, target)
    }
}

class CDrawCard implements Cmd<DrawCard> {
    readonly isUserCmd = false
    readonly tag = "DrawCard"
    exec(a: Player): void {
        if (a.game?.state !== "Turn") return
        if (a !== a.game.currentPlayer) return
        a.game.drawCard(a)
    }
}

class CPlayCard implements Cmd<PlayCard> {
    readonly isUserCmd = false
    readonly tag = "PlayCard"
    exec(a: Player): void {
        if (a.game?.state !== "Turn") return
        if (a !== a.game.currentPlayer) return
        if (!a.card) return
        a.game.playCard(a)
    }
}

class CSetDrift implements Cmd<SetDrift> {
    readonly tag = "SetDrift"
    constructor(readonly drift: Drift) {}
    readonly isUserCmd = false
    exec(a: Player): void {
        a.setDrift(this.drift)
    }
}

// biome-ignore format: better look like a switch-case.
type CmdByTag<A extends Action> =
    A extends Speak ? CSpeak :
    A extends StartGame ? CStartGame :
    A extends SetBet ? CSetBet :
    A extends Shoot ? CShoot :
    A extends DrawCard ? CDrawCard :
    A extends PlayCard ? CPlayCard :
    A extends SetDrift ? CSetDrift :
    never

export const dispatchCmd = <T extends Action>(a: T): CmdByTag<T> => {
    switch (a.tag) {
        case "Speak":
            // @ts-expect-error
            return new CSpeak(a.message)
        case "StartGame":
            // @ts-expect-error
            return new CStartGame()
        case "SetBet":
            // @ts-expect-error
            return new CSetBet(a.amount)
        case "Shoot":
            // @ts-expect-error
            return new CShoot(a.index)
        case "DrawCard":
            // @ts-expect-error
            return new CDrawCard()
        case "PlayCard":
            // @ts-expect-error
            return new CPlayCard()
        case "SetDrift":
            // @ts-expect-error
            return new CSetDrift(a.drift)
    }
}
