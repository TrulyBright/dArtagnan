import { UserSpoke } from "@api/event"
import { Player } from "./player"
import { User } from "./user"
import { Action, DrawCard, PlayCard, Shoot, Speak, StartGame, SetDrift, UserAction, PlayerAction } from "@api/action"
import { Drift } from "@api/drift"

type ActorByAction<A extends Action> = A extends UserAction ? User : Player

type Cmd<A extends Action> = {
    exec(a: ActorByAction<A>): void
} & A

class CSpeak implements Cmd<Speak> {
    readonly tag = 'Speak'
    constructor(readonly message: string) {
        this.message = this.message.slice(80).trim()
    }
    exec(a: User): void {
        if (!this.message) return
        a.room?.broadcast(new UserSpoke(this.message, a))
    }
}

class CStartGame implements Cmd<StartGame> {
    readonly tag = 'StartGame'
    exec(a: User): void {
        if (a.room?.host !== a) return
        if (!a.room.startable) return
        if (a.room.game) return
        a.room.startGame()
    }
}

class CShoot implements Cmd<Shoot> {
    readonly tag = 'Shoot'
    constructor(readonly index: number) {}
    exec(a: Player): void {
    }
}

class CDrawCard implements Cmd<DrawCard> {
    readonly tag = 'DrawCard'
    exec(a: Player): void {
    }
}

class CPlayCard implements Cmd<PlayCard> {
    readonly tag = "PlayCard"
    exec(a: Player): void {
    }
}

class CSetDrift implements Cmd<SetDrift> {
    readonly tag = 'SetDrift'
    constructor(readonly drift: Drift) {}
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

export const isUserCommand = (a: Cmd<Action>): a is Cmd<UserAction> => (
    a.tag === 'Speak' || a.tag === 'StartGame'
)