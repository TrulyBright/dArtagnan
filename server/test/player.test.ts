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
    PlayerDrewCard,
    YourCard,
} from "@dartagnan/api/event"
import { beforeEach, expect, test, vi } from "vitest"
import { createExpectRecvd, RecvExpector } from "./common"
import { dispatchCmd } from "#action"
import { Mediation } from "@dartagnan/api/card"

type GameTestContext = {
    G: Game
    players: Player[]
    expectRecvd: RecvExpector
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
        // Originally, this line was G.addbroadcaster(p.recv.bind(p)).
        // But it didn't fire vitest mock. vi.spyOn() didn't count bind().
        // Thus I made an arrow lambda here, though I prefer bind().
        // TODO: add a feature request to vitest to notify of such a behavior.
        G.addbroadcaster(e => p.recv(e))
    }
    context.G = G
    context.players = players
    context.expectRecvd = createExpectRecvd(players)
    expect(G.state).toBe("Idle")
    G.start()
    expect(G.state).toBe("BetSetup")
})

test<GameTestContext>("Game overall", ({ G, players, expectRecvd }) => {
    for (let roundIndex = 1; roundIndex <= G.maxRound; roundIndex++) {
        expect(G.round).toBe(roundIndex)
        for (const p of players) {
            expectRecvd(p, new NewRound(G.round))
            expectRecvd(p, new Stakes(0))
            // players are reset.
            for (const other of players) expectRecvd(p, new PlayerStatus(other))
        }
        expect(G.state).toBe("BetSetup")
        expect(G.currentPlayer).not.toBeNull()
        const betSetter = G.currentPlayer!
        if (G.round === 1) expect(G.currentPlayer).toBe(betSetter)
        for (const p of players) expectRecvd(p, new BetSetupStart(betSetter))
        for (
            let elapsed = 0;
            elapsed <= Game.timeLimit;
            elapsed += Game.timeQuantum
        ) {
            vi.runOnlyPendingTimers()
            for (const p of players)
                expectRecvd(
                    p,
                    new Countdown(Game.timeLimit, Game.timeLimit - elapsed),
                )
        }
        // bet set timeout.
        for (const p of players)
            expectRecvd(p, new BetSetupDone(G.defaultBetAmount))
        expect(G.currentPlayer).toBe(betSetter)
        let willShoot = true
        do {
            willShoot = !willShoot
            const stakes = G.stakes
            expect(G.state).toBe("Turn")
            for (const p of players) {
                for (const other of G.seated)
                    expectRecvd(p, new PlayerStatus(other)) // accuracy is set.
                expectRecvd(p, new NowTurnOf(G.currentPlayer!))
                expectRecvd(p, new PlayerStatus(G.currentPlayer!)) // LastDitch is reset.
            }
            const originalBalance: Record<Player["index"], Player["balance"]> =
                Object.assign(
                    {},
                    ...G.players.map(p => ({ [p.index]: p.balance })),
                )
            if (!willShoot) {
                const drawing = G.currentPlayer!
                G.drawCard(drawing)
                expectRecvd(drawing, new YourCard(drawing.card))
                for (const p of players) {
                    expectRecvd(p, new PlayerDrewCard(drawing))
                    expectRecvd(p, new PlayerStatus(drawing)) // withdraw
                    expectRecvd(
                        p,
                        new Stakes(
                            stakes +
                                Math.min(originalBalance[drawing.index], G.bet),
                        ),
                    )
                    if (drawing.bankrupt)
                        expectRecvd(p, new PlayerStatus(drawing))
                }
                expect(drawing.bankrupt).toBe(
                    originalBalance[drawing.index] <= G.bet,
                )
                continue
            }
            const shooter = G.currentPlayer!
            const target = G.randomSeated(shooter)
            vi.spyOn(G, "randomSeated").mockReturnValueOnce(target)
            const loot = Math.min(target.balance, G.bet)
            const targetWithdrawSpy = vi.spyOn(target, "withdraw")
            const shooterDepositSpy = vi.spyOn(shooter, "deposit")
            const shooterWithdrawSpy = vi.spyOn(shooter, "withdraw")
            for (
                let elapsed = 0;
                elapsed <= Game.timeLimit;
                elapsed += Game.timeQuantum
            ) {
                vi.runOnlyPendingTimers()
                for (const p of players)
                    expectRecvd(
                        p,
                        new Countdown(Game.timeLimit, Game.timeLimit - elapsed),
                    )
            }
            // shoot at random player on timeout
            for (const p of players)
                expectRecvd(p, new PlayerShot(shooter, target))
            expect(loot).toBeGreaterThan(0)
            let expectedShooterBalance: number
            let expectedTargetBalance: number
            if (target.seated) {
                // miss: do nothing
                expectedShooterBalance = Math.max(
                    0,
                    originalBalance[shooter.index] - G.bet,
                )
                expectedTargetBalance = originalBalance[target.index]
                expect(target.seated).toBe(true)
            } else {
                // hit: loot and bet it after. Do not bet if the round is over.
                expectedTargetBalance = Math.max(
                    0,
                    originalBalance[target.index] - loot,
                )
                if (G.seated.length === 1)
                    // round is over
                    expectedShooterBalance = Math.max(
                        0,
                        originalBalance[shooter.index] + loot,
                    )
                else
                    expectedShooterBalance = Math.max(
                        0,
                        originalBalance[shooter.index] + loot - G.bet,
                    )
                expect(targetWithdrawSpy).toHaveBeenNthCalledWith(1, G.bet)
                expect(shooterDepositSpy).toHaveBeenNthCalledWith(1, loot)
                for (const p of players) {
                    expectRecvd(p, new PlayerStatus(target)) // withdraw
                    expectRecvd(p, new PlayerStatus(shooter)) // deposit
                    expectRecvd(p, new PlayerStatus(shooter)) // lose robbery
                    expectRecvd(p, new PlayerStatus(target)) // unseat
                }
                expect(target.seated).toBe(false)
            }
            expect(shooter.balance).toBe(expectedShooterBalance)
            expect(target.balance).toBe(expectedTargetBalance)
            if (G.seated.length === 1) {
                expect(G.state).toBe("RoundCeremony")
                for (const p of players)
                    expectRecvd(p, new RoundWinner(G.seated[0]))
            } else {
                expect(shooterWithdrawSpy).toHaveBeenNthCalledWith(1, G.bet)
                const maximum = Math.min(
                    originalBalance[shooter.index] + loot,
                    G.bet,
                ) // failing
                expect(G.stakes).toBe(stakes + maximum)
                for (const p of players) {
                    expectRecvd(p, new PlayerStatus(shooter)) // bet
                    expectRecvd(p, new Stakes(G.stakes))
                    if (shooter.bankrupt)
                        expectRecvd(p, new PlayerStatus(shooter)) // unseat
                    expect(shooter.seated).not.toBe(shooter.bankrupt)
                }
            }
        } while (G.seated.length !== 1)
        vi.runOnlyPendingTimers()
    }
    expect(G.state).toBe("GameOver")
    for (const p of players) expectRecvd(p, new GameOver())
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
    G.drawCard(drawing)
    expect(drawing.balance).toBe(originalBalance - cmd.amount)
})

test<GameTestContext>("Designated Shot", ({ G, players }) => {
    G.setBet(G.defaultBetAmount)
    const shooter = G.currentPlayer!
    shooter.accuracy = 1
    const target =
        G.seated[(G.seated.indexOf(shooter) + G.turnOrder) % G.seated.length]
    expect(G.whoPlaysNext).toBe(target)
    const nextShooter =
        G.seated[(G.seated.indexOf(target) + G.turnOrder) % G.seated.length]
    const originalStakes = G.stakes
    G.shoot(shooter, target)
    expect(target.seated).toBe(false)
    expect(G.stakes).toBe(originalStakes + G.bet)
    expect(G.currentPlayer).not.toBe(shooter)
    expect(G.currentPlayer).not.toBe(target)
    expect(G.currentPlayer).toBe(nextShooter)
})

test<GameTestContext>("Drift: increment", ({ G, players }) => {
    for (const p of players) {
        p.setDrift(1)
        p.setBuff(Mediation)
        expect(p.drift).toBe(1)
    }
    G.setBet(0)
    while (!players.every(p => p.accuracy === Player.ACCURACY_MAX))
        G.drawCard(G.currentPlayer!)
}) // All we do here is wait until it escapes the while loop.

test<GameTestContext>("Drift: decrement", ({ G, players }) => {
    for (const p of players) {
        p.setDrift(-1)
        p.setBuff(Mediation)
        expect(p.drift).toBe(-1)
    }
    G.setBet(0)
    while (!players.every(p => p.accuracy === Player.ACCURACY_MIN))
        G.drawCard(G.currentPlayer!)
}) // All we do here is wait until it escapes the while loop.

// // TODO: how to test Drift 0 (stable) ?

test<GameTestContext>("Card: ")
