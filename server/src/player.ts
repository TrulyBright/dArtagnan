import { Buff, BuffStatusReset, randomCard, type Card } from "@dartagnan/api/card"
import { Drift, randomDrift } from "@dartagnan/api/drift"
import { PlayerStatus, type Event } from "@dartagnan/api/event"
import type { PlayerBase } from "@dartagnan/api/player"
import type { Game } from "#game"
import { Listening } from "#listening"

const broadcastStatus = (target: Player, name: string, descriptor: PropertyDescriptor) => {
    const original = descriptor.value
    descriptor.value = function (...args: any[]) {
        const result = original.apply(this, args)
        target.game?.broadcast(new PlayerStatus(target))
        return result
    }
}

export class Player extends Listening<Event> implements PlayerBase {
    game: Game | null = null
    constructor(readonly index: number) {
        super()
    }
    buff: PlayerBase['buff'] = BuffStatusReset
    seated = true
    balance = 200
    card: Card | null = null
    accuracy = Math.random()
    drift = randomDrift()
    get bankrupt() {
        return this.balance === 0
    }
    @broadcastStatus
    setDrift(d: Drift) {
        this.drift = d
    }
    @broadcastStatus
    setAccuracy(a: number) {
        this.accuracy = a
    }
    @broadcastStatus
    getCard(c: Card | null) {
        this.card = c
    }
    @broadcastStatus
    unseat() {
        this.seated = false
    }
    @broadcastStatus
    setBuff(b: Buff['tag']) {
        this.buff = b
    }
    @broadcastStatus
    unsetBuff() {
        this.buff = BuffStatusReset
    }
    join(g: Game) {
        this.game = g
    }
    /** Keep the balance. */
    @broadcastStatus
    reset() {
        if (this.bankrupt) return
        this.seated = true
        this.accuracy = Math.random()
        this.drift = randomDrift()
        this.card = randomCard()
        this.buff = BuffStatusReset
    }
    /**
     * @returns the balance after the deposit.
     */
    @broadcastStatus
    deposit(n: number) {
        this.balance += n
        return this.balance
    }
    /**
     * Withdraws the given amount from the balance.
     * If the balance is insufficient, take all the balance.
     * @param n the amount to withdraw.
     * @returns the actual amount withdrawn.
     */
    @broadcastStatus
    withdraw(n: number) {
        const actual = Math.min(this.balance, n)
        this.balance -= actual
        return actual
    }

}
