import { type Buff, type Card, Insurance } from "@dartagnan/api/card"
import { type Drift, randomDrift } from "@dartagnan/api/drift"
import type { Event } from "@dartagnan/api/event"
import type { PlayerBase } from "@dartagnan/api/player"
import { BuffResetLiteral, randomCard } from "#card"
import type { Game } from "#game"
import { Listening } from "#listening"

// biome-ignore format: better look like an if-else.
const inRange = (n: number, max: number, min: number) => (
    min > n ? min :
    max < n ? max :
    n
)

const broadcastStatus = (
    target: Player,
    name: string,
    descriptor: PropertyDescriptor,
) => {
    const original = descriptor.value
    descriptor.value = function (this: Player, ...args: unknown[]) {
        const result = original.apply(this, args)
        this.game.broadcast({ tag: "PlayerStatus", player: this })
        return result
    }
    return descriptor
}

export class Player extends Listening<Event> implements PlayerBase {
    static readonly ACCURACY_MAX = 0.99
    static readonly ACCURACY_MIN = 0.01
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
    accuracy = inRange(Math.random(), Player.ACCURACY_MAX, Player.ACCURACY_MIN)
    drift = randomDrift()
    get bankrupt() {
        return this.balance <= 0
    }
    get nextDriftedAccuracy(): number {
        const increment = 0.08 * this.drift
        const error = (Math.random() - 0.5) * 0.2 // TODO: ask mathematicians.
        const next = this.buff.Mediation
            ? this.accuracy + increment
            : this.accuracy + increment + error
        return inRange(next, Player.ACCURACY_MAX, Player.ACCURACY_MIN)
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
        this.recv({ tag: "YourCard", card: c })
        this.game.broadcast({ tag: "PlayerDrewCard", player: this })
    }
    loseCard() {
        this.card = null
        this.recv({ tag: "YourCard", card: null })
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
