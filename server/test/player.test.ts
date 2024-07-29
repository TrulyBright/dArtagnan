import { Game } from "#game"
import { Player } from "#player"
import { Room } from "#room"
import {
    GameOver,
    BetSetupDone,
    BetSetupStart,
    Countdown,
    NewRound,
    NowTurnOf,
    PlayerShot,
    PlayerStatus,
    RoundWinner,
    Stakes,
} from "@dartagnan/api/event"
import { beforeEach, expect, test, vi } from "vitest"

beforeEach(() => {
    vi.useFakeTimers()
})

test("Game overall", () => {
    const G = new Game()
    const players = Array.from(
        { length: Room.MAX_MEMBERS },
        (_, i) => new Player(i, G),
    )
    for (const p of players) {
        G.addPlayer(p)
        G.addbroadcaster(p.recv.bind(p))
    }
    expect(G.state).toBe("Idle")
    G.start()
    for (let roundIndex = 1; roundIndex <= G.maxRound; roundIndex++) {
        expect(G.round).toBe(roundIndex)
        for (const p of players) {
            expect(p.earliestEvent).toStrictEqual(new NewRound(G.round))
            expect(p.earliestEvent).toStrictEqual(new Stakes(0))
            // players are reset.
            for (const other of players)
                expect(p.earliestEvent).toStrictEqual(new PlayerStatus(other))
        }
        expect(G.state).toBe("BetSetup")
        expect(G.currentPlayer).not.toBeNull()
        const betSetter = G.currentPlayer!
        if (G.round === 1) expect(G.currentPlayer).toBe(betSetter)
        for (const p of players)
            expect(p.earliestEvent).toStrictEqual(new BetSetupStart(betSetter))
        for (
            let elapsed = 0;
            elapsed <= Game.timeLimit;
            elapsed += Game.timeQuantum
        ) {
            vi.runOnlyPendingTimers()
            for (const p of players)
                expect(p.earliestEvent).toStrictEqual(
                    new Countdown(Game.timeLimit, Game.timeLimit - elapsed),
                )
        }
        // bet set timeout.
        for (const p of players) {
            expect(p.earliestEvent).toStrictEqual(
                new BetSetupDone(G.defaultBetAmount),
            )
        }
        expect(G.currentPlayer).toBe(betSetter)
        do {
            const stakes = G.stakes
            expect(G.state).toBe("Turn")
            for (const p of players) {
                expect(p.earliestEvent).toStrictEqual(
                    new NowTurnOf(G.currentPlayer!),
                )
                expect(p.earliestEvent).toStrictEqual(
                    new PlayerStatus(G.currentPlayer!),
                ) // LastDitch is reset.
            }
            const originalBalance: Record<Player["index"], Player["balance"]> =
                Object.assign(
                    {},
                    ...G.players.map(p => ({ [p.index]: p.balance })),
                )
            const shooter = G.currentPlayer!
            for (
                let elapsed = 0;
                elapsed <= Game.timeLimit;
                elapsed += Game.timeQuantum
            ) {
                vi.runOnlyPendingTimers()
                for (const p of players)
                    expect(p.earliestEvent).toStrictEqual(
                        new Countdown(Game.timeLimit, Game.timeLimit - elapsed),
                    )
            }
            // shoot at random player on timeout
            const e = players[0].earliestEvent as PlayerShot
            expect(e).toBeInstanceOf(PlayerShot)
            const { target } = e
            for (const p of players.slice(1)) {
                expect(p.earliestEvent).toStrictEqual(e)
            }
            if (target.seated) {
                // miss
                expect(shooter.balance).toBe(
                    Math.max(0, originalBalance[shooter.index] - G.bet),
                ) // only bet.
                expect(target.balance).toBe(originalBalance[target.index])
            } else {
                // hit
                // Take loot and bet it after. Do not bet if the round is over.
                expect(shooter.balance).toBe(
                    G.seated.length === 1
                        ? originalBalance[shooter.index] + G.bet
                        : originalBalance[shooter.index],
                )
                expect(target.balance).toBe(
                    Math.max(0, originalBalance[target.index] - G.bet),
                )
                for (const p of players) {
                    expect(p.earliestEvent).toStrictEqual(
                        new PlayerStatus(target),
                    ) // withdraw
                    expect(p.earliestEvent).toStrictEqual(
                        new PlayerStatus(shooter),
                    ) // deposit
                    expect(p.earliestEvent).toStrictEqual(
                        new PlayerStatus(shooter),
                    ) // lose robbery
                    expect(p.earliestEvent).toStrictEqual(
                        new PlayerStatus(target),
                    ) // unseat with no insurance
                }
            }
            if (G.seated.length === 1) {
                for (const p of players) {
                    expect(p.earliestEvent).toStrictEqual(
                        new RoundWinner(G.seated[0]),
                    )
                }
            } else {
                expect(G.stakes).toBe(stakes + G.bet)
                for (const p of players) {
                    expect(p.earliestEvent).toStrictEqual(
                        new PlayerStatus(shooter),
                    ) // bet
                    expect(p.earliestEvent).toStrictEqual(new Stakes(G.stakes))
                    if (shooter.bankrupt)
                        expect(p.earliestEvent).toStrictEqual(
                            new PlayerStatus(shooter),
                        ) // unseat
                }
            }
        } while (G.seated.length !== 1)
        vi.runOnlyPendingTimers()
    }
    expect(G.state).toBe("GameOver")
    for (const p of players) {
        expect(p.earliestEvent).toStrictEqual(new GameOver())
    }
})
