import { Player } from "#player"
import { BetSetupStart, Countdown, Event, GameOver, NewRound, NowTurnOf, RoundWinner } from "@dartagnan/api/event"
import { GameBase, State } from "@dartagnan/api/game"
import { t, StateMachine, Callback } from "typescript-fsm"

export enum FSMEvent { StartGame, StartBetSetup, SetBet, ToNextTurn, EndRound, NewRound, EndGame }

export class Game extends StateMachine<State, FSMEvent, Record<FSMEvent, Callback>> implements GameBase {
    private static readonly timeQuantum = 1000
    private static readonly timeLimit = Game.timeQuantum * 15
    private readonly _players: Player[] = []
    get players(): readonly Player[] { return this._players }
    private _turnOrder: GameBase['turnOrder'] = 1
    get turnOrder() { return this._turnOrder }
    round = 0
    currentPlayer : Player | null = null
    private lastWinner: Player | null = null
    bet = 10
    stakes = 0
    private countdown: NodeJS.Timeout | null = null
    private timeRemaining = Game.timeLimit
    constructor(readonly maxRound: number) {
        super(State.Idle)
        this.addTransitions([
            t(State.Idle, FSMEvent.StartGame, State.RoundInit, this.startRound),
            t(State.RoundInit, FSMEvent.StartBetSetup, State.BetSetup, this.startBetSetup),
            t(State.BetSetup, FSMEvent.SetBet, State.Turn, this.setBet),
            t(State.Turn, FSMEvent.ToNextTurn, State.Turn, this.toNextTurn),
            t(State.Turn, FSMEvent.EndRound, State.RoundCeremony, this.endRound),
            t(State.RoundCeremony, FSMEvent.NewRound, State.RoundInit, this.startRound),
            t(State.RoundCeremony, FSMEvent.EndGame, State.GameOver, this.endGame)
        ])
    }
    get seated(): readonly Player[] { return this.players.filter(p => p.seated) }
    broadcast<E extends Event>(e: E) {
        for (const p of this.players)
            p.recv(e)
    }
    addPlayer(p: Player) {
        if (this.getState() !== State.Idle) throw new Error("Game has already started")
        this._players.push(p)
    }
    removePlayer(p: Player) {
        if (this.getState() !== State.Idle) throw new Error("Game has already started")
        const i = this.players.indexOf(p)
        if (i === -1) throw new Error("Player not found")
        this._players.splice(i, 1)
    }
    startTurnOf(p: Player) {
        this.clearCountdown()
        this.currentPlayer = p
        this.broadcast(new NowTurnOf(p))
        this.countdown = setInterval(() => {
            this.broadcast(new Countdown(Game.timeLimit, this.timeRemaining))
            if (this.timeRemaining <= 0) {
                this.clearCountdown()
                this.dispatch(this.seated.length === 1 ? FSMEvent.EndRound : FSMEvent.ToNextTurn)
            }
            this.timeRemaining -= Game.timeQuantum
        }, 1000)
    }
    reverseTurnOrder() {
        this._turnOrder *= -1
    }
    private clearCountdown() {
        if (this.countdown) clearInterval(this.countdown)
    }
    private startRound() {
        this.clearCountdown()
        this.round++
        this.broadcast(new NewRound(this.round))
        for (const p of this.players) p.reset()
        this.dispatch(FSMEvent.StartBetSetup)
    }
    private startBetSetup() {
        this.clearCountdown()
        if (this.round === 1) this.currentPlayer = this.seated[0]
        else if (!this.lastWinner)
            throw new Error("No last winner in previous round")
        else this.currentPlayer = this.lastWinner
        this.broadcast(new BetSetupStart(this.currentPlayer))
        this.countdown = setInterval(() => {
            this.broadcast(new Countdown(Game.timeLimit, this.timeRemaining))
            if (this.timeRemaining <= 0) {
                this.clearCountdown()
                this.dispatch(FSMEvent.SetBet)
            }
            this.timeRemaining -= Game.timeQuantum
        }, 1000)
    }
    private setBet() {
        this.clearCountdown()
        if (!this.currentPlayer)
            throw new Error("No current player")
        this.startTurnOf(this.currentPlayer)
    }
    private toNextTurn() {
        this.clearCountdown()
        if (!this.currentPlayer) throw new Error("No current player")
        const i = this.seated.indexOf(this.currentPlayer!)
        this.currentPlayer = this.seated[(i + 1) % this.seated.length]
        this.startTurnOf(this.currentPlayer)
    }
    private endRound() {
        this.clearCountdown()
        const lastManStanding = this.seated[0]
        this.lastWinner = lastManStanding
        this.broadcast(new RoundWinner(lastManStanding))
        this.dispatch(this.round === this.maxRound ? FSMEvent.EndGame : FSMEvent.NewRound)
    }
    private endGame() {
        this.clearCountdown()
        this.broadcast(new GameOver())
    }
}