import { Buff, BuffStatusReset, randomCard, type Card } from "@dartagnan/api/card"
import { randomDrift } from "@dartagnan/api/drift"
import type { Event } from "@dartagnan/api/event"
import type { PlayerBase } from "@dartagnan/api/player"
import type { Game } from "#game"
import { Listening } from "#listening"

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
    join(g: Game) {
        this.game = g
    }
    /** Keep the balance. */
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
    withdraw(n: number) {
        const actual = Math.min(this.balance, n)
        this.balance -= actual
        return actual
    }
}
