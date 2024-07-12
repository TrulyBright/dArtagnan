import { UserSpoke } from "@dartagnan/api/event"
import { Player } from "#player"
import { User } from "#user"
import { Action, DrawCard, PlayCard, Shoot, Speak, StartGame, SetDrift, UserAction } from "@dartagnan/api/action"
import { Drift } from "@dartagnan/api/drift"
import { GameIdle, isGameIn } from "#game"

type ActorByAction<A extends Action> = A extends UserAction ? User : Player

type Cmd<A extends Action> = {
    exec(a: ActorByAction<A>): void
    readonly isUserCmd: A extends UserAction ? true : false
} & A

class CSpeak implements Cmd<Speak> {
    readonly tag = 'Speak'
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
    readonly tag = 'StartGame'
    exec(a: User): void {
        if (a.room?.host !== a) return
        if (!a.room.startable) return
        if (a.room.game) return
        const g = new GameIdle()
        a.room.users.forEach((u, i) => {
            const p = new Player(i)
            g.addPlayer(p)
            u.associate(p)
        })
        a.room.game = g
        g.switchTo('BetSetup')
    }
}

class CShoot implements Cmd<Shoot> {
    readonly tag = 'Shoot'
    constructor(readonly index: number) {}
    readonly isUserCmd = false
    exec(a: Player): void {
        if (!isGameIn(a.game, 'Turn')) return
        if (a !== a.game.currentPlayer) return
    }
}

class CDrawCard implements Cmd<DrawCard> {
    readonly isUserCmd = false
    readonly tag = 'DrawCard'
    exec(a: Player): void {
    }
}

class CPlayCard implements Cmd<PlayCard> {
    readonly isUserCmd = false
    readonly tag = "PlayCard"
    exec(a: Player): void {
    }
}

class CSetDrift implements Cmd<SetDrift> {
    readonly tag = 'SetDrift'
    constructor(readonly drift: Drift) {}
    readonly isUserCmd = false
    exec(a: Player): void {
    }
}

export const dispatch = <T extends Action>(a: T) => {
    switch (a.tag) {
        case 'Speak': return new CSpeak(a.message)
        case 'StartGame': return new CStartGame()
        case 'Shoot': return new CShoot(a.index)
        case 'DrawCard': return new CDrawCard()
        case 'PlayCard': return new CPlayCard()
        case 'SetDrift': return new CSetDrift(a.drift)
    }
}