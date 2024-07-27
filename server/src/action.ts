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
import { Bulletproof, Curse, Robbery } from "@dartagnan/api/card"
import type { Drift } from "@dartagnan/api/drift"
import { CardPlayed, PlayerShot, UserSpoke } from "@dartagnan/api/event"
import { dispatchCardStrategy, randomCard } from "#card"
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
        console.log(1234)
        if (!this.message) return
        console.log(5678)
        a.room?.broadcast(new UserSpoke(this.message, a))
    }
}

class CStartGame implements Cmd<StartGame> {
    readonly isUserCmd = true
    readonly tag = "StartGame"
    exec(a: User): void {
        if (a.room?.host !== a) return
        if (!a.room.startable) return
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
        // TODO
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
        a.game.broadcast(new PlayerShot(a, target))
        if (a.buff.Curse) {
            a.unsetBuff(Curse)
            target.setAccuracy(Curse.accuracy)
        }
        const success = Math.random() < a.accuracy
        if (!success) {
            // Do nothing
        } else if (target.buff.Bulletproof) {
            target.unsetBuff(Bulletproof)
        } else {
            const loot = a.buff.Robbery
                ? a.game.bet * Robbery.multiplier
                : a.game.bet
            a.deposit(target.withdraw(loot))
            a.unsetBuff(Robbery)
            target.unseat()
        }
        a.game.turnDone()
    }
}

class CDrawCard implements Cmd<DrawCard> {
    readonly isUserCmd = false
    readonly tag = "DrawCard"
    exec(a: Player): void {
        if (a.game?.state !== "Turn") return
        if (a !== a.game.currentPlayer) return
        a.getCard(randomCard())
        a.game.turnDone()
    }
}

class CPlayCard implements Cmd<PlayCard> {
    readonly isUserCmd = false
    readonly tag = "PlayCard"
    exec(a: Player): void {
        if (a.game?.state !== "Turn") return
        if (a !== a.game.currentPlayer) return
        if (!a.card) return
        const played = a.card
        a.loseCard()
        a.game.broadcast(new CardPlayed(played))
        const f = dispatchCardStrategy(played)
        f(a)
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

export const dispatchCmd = <T extends Action>(a: T) => {
    switch (a.tag) {
        case "Speak":
            return new CSpeak(a.message)
        case "StartGame":
            return new CStartGame()
        case "SetBet":
            return new CSetBet(a.amount)
        case "Shoot":
            return new CShoot(a.index)
        case "DrawCard":
            return new CDrawCard()
        case "PlayCard":
            return new CPlayCard()
        case "SetDrift":
            return new CSetDrift(a.drift)
    }
}
