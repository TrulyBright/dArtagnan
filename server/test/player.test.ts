import { Game } from "#game"
import { Player } from "#player"
import { Room } from "#room"
import { BetSetupDone, BetSetupStart, Countdown, NewRound, NowTurnOf, PlayerStatus } from "@dartagnan/api/event"
import { State } from "@dartagnan/api/game"
import { beforeEach, expect, test, vi } from "vitest"

const Idle: State = "Idle"
const RoundInit: State = "RoundInit"
const BetSetup: State = "BetSetup"
const RoundCeremony: State = "RoundCeremony"
const Turn: State = "Turn"
const GameOver: State = "GameOver"

beforeEach(() => {
    vi.useFakeTimers()
})

test("Game overall", () => {
    const G = new Game()
    const players = Array.from({ length: Room.MAX_MEMBERS }, (_, i) => new Player(i, G))
    for (const p of players) {
        G.addPlayer(p)
        G.addbroadcaster(p.recv.bind(p))
    }
    expect(G.state).toBe(Idle)
    G.start()
    for (const p of players) {
        expect(p.earliestEvent).toStrictEqual(new NewRound(1))
        // players are reset.
        for (const other of players)
            expect(p.earliestEvent).toStrictEqual(new PlayerStatus(other))
    }
    expect(G.state).toBe(BetSetup)
    const first = players[0]
    expect(G.currentPlayer).toBe(first)
    for (const p of players)
        expect(p.earliestEvent).toStrictEqual(new BetSetupStart(players[0]))
    for (let elapsed = 0; elapsed <= Game.timeLimit; elapsed += Game.timeQuantum) {
        vi.runOnlyPendingTimers()
        for (const p of players)
            expect(p.earliestEvent)
            .toStrictEqual(new Countdown(Game.timeLimit, Game.timeLimit - elapsed))
    }
    for (const p of players) {
        expect(p.earliestEvent).toStrictEqual(new BetSetupDone(G.defaultBetAmount))
        expect(G.currentPlayer).toStrictEqual(first)
        expect(p.earliestEvent).toStrictEqual(new NowTurnOf(first))
        expect(p.earliestEvent).toStrictEqual(new PlayerStatus(first)) // reset lastditch
    }
    for (let elapsed = 0; elapsed <= Game.timeLimit; elapsed += Game.timeQuantum) {
        vi.runOnlyPendingTimers()
        for (const p of players)
            expect(p.earliestEvent)
            .toStrictEqual(new Countdown(Game.timeLimit, Game.timeLimit - elapsed))
    }
})