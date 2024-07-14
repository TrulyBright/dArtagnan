import { Player } from "#player"
import { Bulletproof, Card, Insurance } from "@dartagnan/api/card"

type CardStrategy = (p: Player) => void

const SInsurance: CardStrategy = (p: Player) => {
    p.withdraw(Insurance.payout)
    p.setBuff(Insurance.tag)
    if (p.bankrupt) {
        p.unseat()
        // TODO: to next turn
    }
}

const SBulletproof: CardStrategy = (p: Player) => {
    p.withdraw(Bulletproof.cost)
    p.setBuff(Bulletproof.tag)
    if (p.bankrupt) {
        p.unseat()
        // TODO: to next turn
    }
}

const SCurse: CardStrategy = (p: Player) => {
    p.setBuff(Curse.tag)
}

const SRobbery: CardStrategy = (p: Player) => {
    p.setBuff(Robbery.tag)
}

const SMediation: CardStrategy = (p: Player) => {
    p.setBuff(Mediation.tag)
}

const SLastDitch: CardStrategy = (p: Player) => {
    p.setAccuracy(p.accuracy - LastDitch.penalty)
    p.setBuff(LastDitch.tag)
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
}

const SDonation: CardStrategy = (p: Player) => {
    p.deposit(Donation.amount)
}


const SDestroy: CardStrategy = (p: Player) => {
    if (!p.game) return
    for (const s of p.game.seated) {
        s.getCard(null)
    }
}

export const dispathCardStrategy = (c: Card): CardStrategy => {
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