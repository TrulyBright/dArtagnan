import { BuffStatusReset, type Card } from "@dartagnan/api/card"
import { randomDrift } from "@dartagnan/api/drift"
import type { Event } from "@dartagnan/api/event"
import type { State } from "@dartagnan/api/game"
import type { PlayerBase } from "@dartagnan/api/player"
import type { GameIn } from "#game"
import { Listening } from "#listening"

export class Player extends Listening<Event> implements PlayerBase {
    game: GameIn<State> | null = null
    constructor(readonly index: number) {
        super()
    }
    buff = BuffStatusReset
    seated = true
    balance = 200
    card: Card | null = null
    accuracy = Math.random()
    drift = randomDrift()
    get bankrupt() {
        return this.balance === 0
    }
    join(g: GameIn<"Idle">) {
        this.game = g
    }
    leave() {
        this.game = null
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
