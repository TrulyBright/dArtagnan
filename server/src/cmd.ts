import type {
    Cmd,
    DrawCard,
    PlayCard,
    SetBet,
    SetDrift,
    Shoot,
    Speak,
    StartGame,
    UserCmd,
} from "@dartagnan/api/cmd"
import type { Drift } from "@dartagnan/api/drift"
import { NeedToBeHost, Unstartable } from "@dartagnan/api/error"
import type { Player } from "#player"
import type { User } from "#user"

type CommanderByCmd<C extends Cmd> = C extends UserCmd ? User : Player

type CmdWithExec<C extends Cmd> = {
    exec(c: CommanderByCmd<C>): void
    readonly isUserCmd: C extends UserCmd ? true : false
} & C

class CSpeak implements CmdWithExec<Speak> {
    readonly tag = "Speak"
    constructor(readonly message: string) {
        this.message = this.message.slice(0, 80).trim()
    }
    readonly isUserCmd = true
    exec(c: User): void {
        if (!this.message) return
        c.room?.speak(c, this.message)
    }
}

class CStartGame implements CmdWithExec<StartGame> {
    readonly isUserCmd = true
    readonly tag = "StartGame"
    exec(c: User): void {
        if (c.room?.host !== c) throw new NeedToBeHost()
        if (!c.room.startable) throw new Unstartable()
        c.room.startGame()
    }
}

class CSetBet implements CmdWithExec<SetBet> {
    readonly isUserCmd = false
    readonly tag = "SetBet"
    constructor(readonly amount: number) {}
    exec(c: Player): void {
        if (c.game?.state !== "BetSetup") return
        if (c.game.currentPlayer !== c) return
        if (!Number.isSafeInteger(this.amount)) return
        if (this.amount < c.game.betWindow[0]) return
        if (this.amount > c.game.betWindow[1]) return
        c.game.setBet(this.amount)
    }
}

class CShoot implements CmdWithExec<Shoot> {
    readonly tag = "Shoot"
    constructor(readonly index: number) {}
    readonly isUserCmd = false
    exec(c: Player): void {
        if (c.game?.state === "Turn") return
        if (c.game?.currentPlayer !== c) return
        const target = c.game.players.at(this.index)
        if (!target) return
        if (target === c) return
        c.game.shoot(c, target)
    }
}

class CDrawCard implements CmdWithExec<DrawCard> {
    readonly isUserCmd = false
    readonly tag = "DrawCard"
    exec(c: Player): void {
        if (c.game?.state !== "Turn") return
        if (c !== c.game.currentPlayer) return
        c.game.drawCard(c)
    }
}

class CPlayCard implements CmdWithExec<PlayCard> {
    readonly isUserCmd = false
    readonly tag = "PlayCard"
    exec(c: Player): void {
        if (c.game?.state !== "Turn") return
        if (c !== c.game.currentPlayer) return
        if (!c.card) return
        c.game.playCard(c)
    }
}

class CSetDrift implements CmdWithExec<SetDrift> {
    readonly tag = "SetDrift"
    constructor(readonly drift: Drift) {}
    readonly isUserCmd = false
    exec(c: Player): void {
        c.setDrift(this.drift)
    }
}

// biome-ignore format: better look like c switch-case.
type CmdByTag<C extends Cmd> =
    C extends Speak ? CSpeak :
    C extends StartGame ? CStartGame :
    C extends SetBet ? CSetBet :
    C extends Shoot ? CShoot :
    C extends DrawCard ? CDrawCard :
    C extends PlayCard ? CPlayCard :
    C extends SetDrift ? CSetDrift :
    never

export const attachExec = <T extends Cmd>(c: T): CmdByTag<T> => {
    switch (c.tag) {
        case "Speak":
            // @ts-expect-error
            return new CSpeak(c.message)
        case "StartGame":
            // @ts-expect-error
            return new CStartGame()
        case "SetBet":
            // @ts-expect-error
            return new CSetBet(c.amount)
        case "Shoot":
            // @ts-expect-error
            return new CShoot(c.index)
        case "DrawCard":
            // @ts-expect-error
            return new CDrawCard()
        case "PlayCard":
            // @ts-expect-error
            return new CPlayCard()
        case "SetDrift":
            // @ts-expect-error
            return new CSetDrift(c.drift)
    }
}
