import { Bulletproof, Curse, LastDitch, Robbery } from "@dartagnan/api/card"
import {
    BetSetupDone,
    BetSetupStart,
    CardPlayed,
    Countdown,
    type Event,
    GameOver,
    NewRound,
    NowTurnOf,
    PlayerShot,
    RoundWinner,
    Stakes,
    TurnOrder,
} from "@dartagnan/api/event"
import type { GameBase, State } from "@dartagnan/api/game"
import { dispatchCardStrategy, randomCard } from "#card"
import type { Listener } from "#listening"
import type { Player } from "#player"

/** This does not broadcast the state. */
const enterState =
    (s: State) =>
    (target: Game, name: string, descriptor: PropertyDescriptor) => {
        const original = descriptor.value
        descriptor.value = function (this: Game, ...args: unknown[]) {
            this.state = s
            this.clearTimer()
            return original.apply(this, args)
        }
        return descriptor
    }

const allowedIn =
    (s: State[]) =>
    (target: Game, name: string, descriptor: PropertyDescriptor) => {
        const original = descriptor.value
        descriptor.value = function (this: Game, ...args: unknown[]) {
            if (!s.includes(this.state))
                throw new Error(
                    `you can't call ${name} in the state ${this.state}. It's allowed only in: ${s}`,
                )
            return original.apply(this, args)
        }
        return descriptor
    }

export class Game implements GameBase {
    // TODO: offer speed-up mode to users. i.e., time values are configurable.
    static readonly MIN_PLAYERS = 3
    static readonly timeQuantum = 1000
    static readonly timeLimit = Game.timeQuantum * 15
    static readonly ceremonyTimeLimit = Game.timeQuantum * 3
    private broadcasters: Listener<Event>[] = []
    private readonly _players: Player[] = []
    get players(): readonly Player[] {
        return this._players
    }
    private _turnOrder: GameBase["turnOrder"] = 1
    get turnOrder() {
        return this._turnOrder
    }
    state: State = "Idle"
    round = 0
    readonly maxRound = 4
    bet = 10
    get betWindow(): readonly [number, number] {
        return [5 * this.round, 5 * this.round + 10]
    }
    get defaultBetAmount() {
        return Math.floor((this.betWindow[0] + this.betWindow[1]) / 2)
    }
    stakes = 0
    currentPlayer: Player | null = null
    private lastWinner: Player | null = null
    private timeRemaining = Game.timeLimit
    private timer: NodeJS.Timeout | null = null
    get seated(): readonly Player[] {
        return this.players.filter(p => p.seated)
    }
    get whoPlaysNext() {
        if (!this.currentPlayer) throw new Error("currentPlayer not set")
        if (this.state === "BetSetup") return this.currentPlayer
        if (this.currentPlayer.buff.LastDitch) return this.currentPlayer
        const i = this.seated.indexOf(this.currentPlayer)
        return this.seated[(i + this.turnOrder) % this.seated.length]
    }
    randomSeated(except: Player | null): Player {
        const pool = this.seated.filter(p => p !== except)
        const picked = pool.at(Math.random() * pool.length)
        if (!picked) throw new Error("No other seated player")
        return picked
    }
    addbroadcaster(l: Listener<Event>) {
        this.broadcasters.push(l)
    }
    /**
     * Call broadcasters with `e` for their argument.
     */
    broadcast<E extends Event>(e: E) {
        for (const l of this.broadcasters) l(e)
    }
    @allowedIn(["Idle"])
    start() {
        this.enterRoundInit(1)
    }
    @allowedIn(["Idle"])
    addPlayer(p: Player) {
        if (this.state !== "Idle") return
        this._players.push(p)
    }
    @allowedIn(["Idle"])
    removePlayer(p: Player) {
        if (this.state !== "Idle") return
        const i = this.players.indexOf(p)
        if (i !== -1) this._players.splice(i, 1)
    }
    @allowedIn(["BetSetup"])
    /** Set the bet amount and proceed to the first turn. */
    setBet(amount: number) {
        if (!this.currentPlayer) throw new Error("No current player")
        this.bet = amount
        this.broadcast(new BetSetupDone(amount))
        this.enterTurn(this.currentPlayer)
    }
    @allowedIn(["Turn"])
    reverseTurnOrder() {
        this._turnOrder *= -1
        this.broadcast(new TurnOrder(this.turnOrder))
    }
    @allowedIn(["RoundInit", "Turn"])
    setStakes(s: number) {
        this.stakes = s
        this.broadcast(new Stakes(s))
    }
    /** Proceed to the next turn, next round, or game over, depending on the context. */
    @allowedIn(["Turn"])
    turnDone() {
        if (this.state !== "Turn") return
        if (this.currentPlayer === null) throw new Error("No current player")
        if (this.seated.length !== 1) {
            this.setStakes(this.stakes + this.currentPlayer.withdraw(this.bet))
            if (this.currentPlayer.bankrupt) this.currentPlayer.unseat()
        }
        if (this.seated.length !== 1) this.enterTurn(this.whoPlaysNext)
        else this.enterRoundCeremony()
    }
    @allowedIn(["Turn"])
    shoot(shooter: Player, target: Player) {
        this.broadcast(new PlayerShot(shooter, target))
        if (shooter.buff.Curse) {
            shooter.unsetBuff(Curse)
            target.setAccuracy(Curse.accuracy)
        }
        const success = Math.random() < shooter.accuracy
        if (!success) {
            // Do nothing
        } else if (target.buff.Bulletproof) {
            target.unsetBuff(Bulletproof)
        } else {
            const loot = shooter.buff.Robbery
                ? this.bet * Robbery.multiplier
                : this.bet
            shooter.deposit(target.withdraw(loot))
            shooter.unsetBuff(Robbery)
            target.unseat()
        }
        this.turnDone()
    }
    @allowedIn(["Turn"])
    drawCard(drawing: Player) {
        drawing.getCard(randomCard())
        this.turnDone()
    }
    @allowedIn(["Turn"])
    playCard(playing: Player) {
        const played = playing.card
        if (!played) throw new Error("playCard() called with no card")
        playing.loseCard()
        this.broadcast(new CardPlayed(played))
        dispatchCardStrategy(played)(playing)
    }
    @enterState("Turn")
    private enterTurn(p: Player) {
        for (const p of this.seated) p.setAccuracy(p.nextDriftedAccuracy)
        this.currentPlayer = p
        this.broadcast(new NowTurnOf(p))
        p.unsetBuff(LastDitch)
        this.timeRemaining = Game.timeLimit
        this.timer = setInterval(() => {
            this.broadcast(new Countdown(Game.timeLimit, this.timeRemaining))
            if (this.timeRemaining <= 0) {
                this.clearTimer()
                this.shoot(p, this.randomSeated(p))
            } else this.timeRemaining -= Game.timeQuantum
        }, Game.timeQuantum)
    }
    @enterState("RoundInit")
    private enterRoundInit(no: number) {
        this.round = no
        this.broadcast(new NewRound(no))
        this.setStakes(0)
        for (const p of this.players) p.reset()
        this.enterBetSetup()
    }
    @enterState("BetSetup")
    private enterBetSetup() {
        if (this.round === 1) this.currentPlayer = this.seated[0]
        else if (!this.lastWinner)
            throw new Error("No last winner in previous round")
        else this.currentPlayer = this.lastWinner
        this.broadcast(new BetSetupStart(this.currentPlayer))
        this.timeRemaining = Game.timeLimit
        this.timer = setInterval(() => {
            this.broadcast(new Countdown(Game.timeLimit, this.timeRemaining))
            if (this.timeRemaining <= 0) {
                this.clearTimer()
                this.setBet(this.defaultBetAmount)
            } else this.timeRemaining -= Game.timeQuantum
        }, Game.timeQuantum)
    }
    @enterState("RoundCeremony")
    private enterRoundCeremony() {
        const lastManStanding = this.seated[0]
        this.lastWinner = lastManStanding
        this.broadcast(new RoundWinner(lastManStanding))
        this.timer = setTimeout(() => {
            if (this.round === this.maxRound) this.enterGameOver()
            else this.enterRoundInit(this.round + 1)
        }, Game.ceremonyTimeLimit)
    }
    @enterState("GameOver")
    private enterGameOver() {
        this.broadcast(new GameOver())
    }
    protected clearTimer() {
        // Here, we use clearInterval() also for setTimeout().
        // https://developer.mozilla.org/en-US/docs/Web/API/clearInterval
        if (this.timer) clearInterval(this.timer)
    }
}
