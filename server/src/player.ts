import { type Buff, type Card, Insurance } from "@dartagnan/api/card"
import { type Drift, randomDrift } from "@dartagnan/api/drift"
import { PlayerDrewCard, PlayerStatus, YourCard } from "@dartagnan/api/event"
import type { PlayerBase } from "@dartagnan/api/player"
import { BuffResetLiteral, randomCard } from "#card"
import type { Game } from "#game"
import { EnqueueOnEvent } from "#queue"

const broadcastStatus = (
    target: Player,
    name: string,
    descriptor: PropertyDescriptor,
) => {
    const original = descriptor.value
    descriptor.value = function (this: Player, ...args: unknown[]) {
        const result = original.apply(this, args)
        this.game.broadcast(new PlayerStatus(this))
        return result
    }
    return descriptor
}

export class Player extends EnqueueOnEvent implements PlayerBase {
    constructor(
        readonly index: number,
        readonly game: Game,
    ) {
        super()
    }
    buff: PlayerBase["buff"] = BuffResetLiteral
    seated = true
    balance = 200
    card: Card | null = null
    accuracy = Math.random()
    drift = randomDrift()
    get bankrupt() {
        return this.balance <= 0
    }
    @broadcastStatus
    setDrift(d: Drift) {
        this.drift = d
    }
    @broadcastStatus
    setAccuracy(a: number) {
        this.accuracy = a
    }
    getCard(c: Card) {
        this.card = c
        this.recv(new YourCard(c))
        this.game.broadcast(new PlayerDrewCard(this))
    }
    loseCard() {
        this.card = null
        this.recv(new YourCard(null))
    }
    @broadcastStatus
    unseat() {
        this.seated = false
        if (this.buff.Insurance) this.deposit(Insurance.payout)
    }
    @broadcastStatus
    setBuff(b: Buff) {
        this.buff[b.tag] = true
    }
    @broadcastStatus
    unsetBuff(b: Buff) {
        this.buff[b.tag] = false
    }
    /** Keep the balance. */
    @broadcastStatus
    reset() {
        if (this.bankrupt) return
        this.seated = true
        this.accuracy = Math.random()
        this.drift = randomDrift()
        this.card = randomCard()
        this.buff = BuffResetLiteral
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
     * Withdraw the given amount from the balance.
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
