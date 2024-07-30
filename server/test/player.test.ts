import { dispatchCmd } from "#action"
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

type GameTestContext = {
    G: Game
    players: Player[]
}

beforeEach<GameTestContext>(async context => {
    vi.useFakeTimers()
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
    expect(G.state).toBe("BetSetup")
    context.G = G
    context.players = players
})

test<GameTestContext>("Game overall", ({ G, players }) => {
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
            const loot = Math.min(originalBalance[target.index], G.bet)
            expect(loot).toBeGreaterThan(0)
            if (target.seated) {
                // miss
                expect(shooter.balance).toBe(
                    Math.max(0, originalBalance[shooter.index] - G.bet),
                ) // only bet.
                expect(target.balance).toBe(originalBalance[target.index])
                expect(target.seated).toBe(true)
            } else {
                // hit
                // loot and bet it after. Do not bet if the round is over.
                if (G.seated.length === 1)
                    expect(shooter.balance).toBe(
                        originalBalance[shooter.index] + loot,
                    )
                else
                    expect(shooter.balance).toBe(
                        Math.max(
                            0,
                            originalBalance[shooter.index] + loot - G.bet,
                        ),
                    )
                expect(target.balance).toBe(
                    originalBalance[target.index] - loot,
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
                expect(target.seated).toBe(false)
            }
            if (G.seated.length === 1) {
                expect(G.state).toBe("RoundCeremony")
                for (const p of players) {
                    expect(p.earliestEvent).toStrictEqual(
                        new RoundWinner(G.seated[0]),
                    )
                }
            } else {
                expect(G.stakes).toBe(
                    stakes +
                        Math.min(originalBalance[shooter.index] + loot, G.bet),
                )
                for (const p of players) {
                    expect(p.earliestEvent).toStrictEqual(
                        new PlayerStatus(shooter),
                    ) // bet
                    expect(p.earliestEvent).toStrictEqual(new Stakes(G.stakes))
                    if (shooter.bankrupt)
                        expect(p.earliestEvent).toStrictEqual(
                            new PlayerStatus(shooter),
                        ) // unseat
                    expect(shooter.seated).not.toBe(shooter.bankrupt)
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

test<GameTestContext>("Designated BetSetup", ({ G, players }) => {
    expect(G.state).toBe("BetSetup")
    const defaultBetAmount = G.bet
    const cmd = dispatchCmd({
        tag: "SetBet",
        amount: Math.floor(((G.betWindow[0] + G.betWindow[1]) * 2) / 3),
    })
    // no effect
    for (const p of players) if (p !== G.currentPlayer) cmd.exec(p)
    expect(G.state).toBe("BetSetup")
    expect(G.bet).toBe(defaultBetAmount)
    // effective
    cmd.exec(G.currentPlayer!)
    expect(G.bet).not.toBe(defaultBetAmount)
    expect(G.bet).toBe(cmd.amount)
    expect(G.state).toBe("Turn")
    // draw card to peacefully end turn and test the bet set by the cmd.
    const drawing = G.currentPlayer!
    const originalBalance = drawing.balance
    dispatchCmd({ tag: "DrawCard" }).exec(drawing)
    expect(drawing.balance).toBe(originalBalance - cmd.amount)
})

test<GameTestContext>("Designated Shot", ({ G, players }) => {
    G.setBet(G.defaultBetAmount)
    const shooter = G.currentPlayer!
    shooter.accuracy = 1
    const target = G.randomSeated(shooter)
    for (const p of players) p.clearEventQ()
    G.shoot(shooter, target)
    expect(target.seated).toBe(false)
    for (const p of players) {
        expect(p.earliestEvent).toStrictEqual(new PlayerShot(shooter, target))
        expect(p.earliestEvent).toStrictEqual(new PlayerStatus(target)) // withdraw
        expect(p.earliestEvent).toStrictEqual(new PlayerStatus(shooter)) // deposit
        expect(p.earliestEvent).toStrictEqual(new PlayerStatus(shooter)) // lose robbery
        expect(p.earliestEvent).toStrictEqual(new PlayerStatus(target)) // unseat with no insurance
    }
})
