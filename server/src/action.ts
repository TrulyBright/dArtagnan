import type {
    Action,
    DrawCard,
    PlayCard,
    SetDrift,
    Shoot,
    Speak,
    StartGame,
    UserAction,
} from "@dartagnan/api/action"
import type { Drift } from "@dartagnan/api/drift"
import { PlayerDrewCard, PlayerShot, PlayerStatus, UserSpoke, YourCard } from "@dartagnan/api/event"
import { GameIdle } from "#game"
import { Player } from "#player"
import type { User } from "#user"
import { CARD_CONSTS, randomCard } from "@dartagnan/api/card"

type ActorByAction<A extends Action> = A extends UserAction ? User : Player

type Cmd<A extends Action> = {
    exec(a: ActorByAction<A>): void
    readonly isUserCmd: A extends UserAction ? true : false
} & A

class CSpeak implements Cmd<Speak> {
    readonly tag = "Speak"
    constructor(readonly message: string) {
        this.message = this.message.slice(80).trim()
    }
    readonly isUserCmd = true
    exec(a: User): void {
        if (!this.message) return
        a.room?.broadcast(new UserSpoke(this.message, a))
    }
}

class CStartGame implements Cmd<StartGame> {
    readonly isUserCmd = true
    readonly tag = "StartGame"
    exec(a: User): void {
        if (a.room?.host !== a) return
        if (!a.room.startable) return
        if (a.room.game) return
        const g = new GameIdle()
        a.room.users.forEach((u, i) => {
            const p = new Player(i)
            g.addPlayer(p)
            p.join(g)
            u.associate(p)
        })
        a.room.game = g
        g.switchTo("BetSetup")
    }
}

class CShoot implements Cmd<Shoot> {
    readonly tag = "Shoot"
    constructor(readonly index: number) {}
    readonly isUserCmd = false
    exec(a: Player): void {
        if (!a.game?.in("Turn")) return
        if (a !== a.game.currentPlayer) return
        const target = a.game.players.at(this.index)
        if (!target) return
        a.game.broadcast(new PlayerShot(a, target))
        if (a.buff.Curse) {
            a.buff.Curse = false
            a.game.broadcast(new PlayerStatus(a))
            target.accuracy = CARD_CONSTS.CURSE_ACCURACY
            a.game.broadcast(new PlayerStatus(target))
        }
        const success = Math.random() < a.accuracy
        if (!success) {} // do nothing
        else if (target.buff.Bulletproof) {
            target.buff.Bulletproof = false
            a.game.broadcast(new PlayerStatus(target))
        } else {
            const loot = a.buff.Robbery ? a.game.bet * CARD_CONSTS.ROBBERY_MULTIPLIER : a.game.bet
            a.deposit(target.withdraw(loot))
            a.buff.Robbery = false
            target.seated = false
            if (target.buff.Insurance) target.deposit(CARD_CONSTS.INSURANCE_PAYOUT)
            a.game.broadcast(new PlayerStatus(a))
            a.game.broadcast(new PlayerStatus(target))
        }
        a.game.switchTo(a.game.seated.length === 1 ? "RoundCeremony" : "Turn")
    }
}

class CDrawCard implements Cmd<DrawCard> {
    readonly isUserCmd = false
    readonly tag = "DrawCard"
    exec(a: Player): void {
        if (!a.game?.in("Turn")) return
        if (a !== a.game.currentPlayer) return
        a.card = randomCard()
        a.recv(new YourCard(a.card))
        a.game.broadcast(new PlayerDrewCard(a))
        a.game.switchTo("Turn")
    }
}

class CPlayCard implements Cmd<PlayCard> {
    readonly isUserCmd = false
    readonly tag = "PlayCard"
    exec(a: Player): void {
        // TODO
    }
}

class CSetDrift implements Cmd<SetDrift> {
    readonly tag = "SetDrift"
    constructor(readonly drift: Drift) {}
    readonly isUserCmd = false
    exec(a: Player): void {
        a.drift = this.drift
        a.game?.broadcast(new PlayerStatus(a))
    }
}

export const dispatch = <T extends Action>(a: T) => {
    switch (a.tag) {
        case "Speak":
            return new CSpeak(a.message)
        case "StartGame":
            return new CStartGame()
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
