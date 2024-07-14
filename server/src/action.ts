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
import {
    CardPlayed,
    PlayerShot,
    UserSpoke,
} from "@dartagnan/api/event"
import { Player } from "#player"
import type { User } from "#user"
import { Game, FSMEvent } from "#game"
import { State } from "@dartagnan/api/game"
import { dispathCardStrategy, randomCard } from "#card"
import { Bulletproof, Curse, Robbery } from "@dartagnan/api/card"

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
        const g = new Game(4)
        a.room.users.forEach((u, i) => {
            const p = new Player(i)
            g.addPlayer(p)
            p.join(g)
            u.associate(p)
        })
        a.room.game = g
        g.dispatch(FSMEvent.NewRound)
    }
}

class CShoot implements Cmd<Shoot> {
    readonly tag = "Shoot"
    constructor(readonly index: number) {}
    readonly isUserCmd = false
    exec(a: Player): void {
        if (a.game?.getState() === State.Turn) return
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
        a.game.dispatch(
            a.game.seated.length === 1
            ? FSMEvent.EndRound
            : FSMEvent.ToNextTurn
        )
    }
}

class CDrawCard implements Cmd<DrawCard> {
    readonly isUserCmd = false
    readonly tag = "DrawCard"
    exec(a: Player): void {
        if (a.game?.getState() !== State.Turn) return
        if (a !== a.game.currentPlayer) return
        a.getCard(randomCard())
        a.game.dispatch(FSMEvent.ToNextTurn)
    }
}

class CPlayCard implements Cmd<PlayCard> {
    readonly isUserCmd = false
    readonly tag = "PlayCard"
    exec(a: Player): void {
        if (a.game?.getState() !== State.Turn) return
        if (a !== a.game.currentPlayer) return
        if (!a.card) return
        const played = a.card
        a.loseCard()
        a.game.broadcast(new CardPlayed(played))
        const f = dispathCardStrategy(played)
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