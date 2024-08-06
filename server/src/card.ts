import {
    type Buff,
    Bulletproof,
    type Card,
    Curse,
    Destroy,
    Donation,
    Insurance,
    LastDitch,
    Mediation,
    Reverse,
    Robbery,
    Run,
    Sharpshooter,
} from "@dartagnan/api/card"
import type { Player } from "#player"

type CardStrategy = (p: Player) => void

const SInsurance: CardStrategy = (p: Player) => {
    p.withdraw(Insurance.payout)
    p.setBuff(Insurance)
    if (p.bankrupt) {
        p.unseat()
        // TODO: to next turn
    }
}

const SBulletproof: CardStrategy = (p: Player) => {
    p.withdraw(Bulletproof.cost)
    p.setBuff(Bulletproof)
    if (p.bankrupt) {
        p.unseat()
        // TODO: to next turn
    }
}

const SCurse: CardStrategy = (p: Player) => {
    p.setBuff(Curse)
}

const SRobbery: CardStrategy = (p: Player) => {
    p.setBuff(Robbery)
}

const SMediation: CardStrategy = (p: Player) => {
    p.setBuff(Mediation)
}

const SLastDitch: CardStrategy = (p: Player) => {
    p.setAccuracy(p.accuracy - LastDitch.penalty)
    p.setBuff(LastDitch)
}

const SSharpshooter: CardStrategy = (p: Player) => {
    p.setAccuracy(Sharpshooter.accuracy)
}

const SReverse: CardStrategy = (p: Player) => {
    p.game?.reverseTurnOrder()
}

const SRun: CardStrategy = (p: Player) => {
    if (!p.game) return
    const taken = Math.floor(p.game.stakes * Run.share)
    p.deposit(taken)
    p.game.setStakes(p.game.stakes - taken)
    p.unseat()
    p.game.turnDone()
}

const SDonation: CardStrategy = (p: Player) => {
    p.deposit(Donation.amount)
}

const SDestroy: CardStrategy = (p: Player) => {
    if (!p.game) return
    for (const s of p.game.seated) {
        s.loseCard()
    }
}

export const dispatchCardStrategy = (c: Card): CardStrategy => {
    switch (c.tag) {
        case "Insurance":
            return SInsurance
        case "Bulletproof":
            return SBulletproof
        case "Curse":
            return SCurse
        case "Robbery":
            return SRobbery
        case "Mediation":
            return SMediation
        case "LastDitch":
            return SLastDitch
        case "Sharpshooter":
            return SSharpshooter
        case "Reverse":
            return SReverse
        case "Run":
            return SRun
        case "Donation":
            return SDonation
        case "Destroy":
            return SDestroy
    }
}

/**
 * add the same card multiple times to increase the chance of drawing it.
 * @readonly
 */
const cardPool = [
    Insurance,
    Bulletproof,
    Curse,
    Robbery,
    Mediation,
    LastDitch,
    Sharpshooter,
    Reverse,
    Run,
    Donation,
    Destroy,
] as const

export const randomCard = (): Card => {
    return cardPool[Math.floor(Math.random() * cardPool.length)]
}

export const BuffResetLiteral: Record<Buff["tag"], false> = {
    Insurance: false,
    Bulletproof: false,
    Curse: false,
    Robbery: false,
    Mediation: false,
    LastDitch: false,
}
