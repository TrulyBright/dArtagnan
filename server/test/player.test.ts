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
import { createExpectRecvd, RecvExpector } from "./common"

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
        do {
            const stakes = G.stakes
            expect(G.state).toBe("Turn")
            for (const p of players) {
                expectRecvd(p, new NowTurnOf(G.currentPlayer!))
                expectRecvd(p, new PlayerStatus(G.currentPlayer!)) // LastDitch is reset.
            }
            const originalBalance: Record<Player["index"], Player["balance"]> =
                Object.assign(
                    {},
                    ...G.players.map(p => ({ [p.index]: p.balance })),
                )
            const shooter = G.currentPlayer!
            const target = G.randomSeated(null)
            vi.spyOn(G, "randomSeated").mockReturnValueOnce(target)
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
            for (const p of players) {
                expectRecvd(p, new PlayerShot(shooter, target))
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
                else if (originalBalance[shooter.index] + loot <= G.bet)
                    expect(shooter.balance).toBe(0)
                else
                    expect(shooter.balance).toBe(
                        originalBalance[shooter.index] + loot - G.bet,
                    )
                expect(target.balance).toBe(
                    originalBalance[target.index] - loot,
                )
                for (const p of players) {
                    expectRecvd(p, new PlayerStatus(target)) // withdraw
                    expectRecvd(p, new PlayerStatus(shooter)) // deposit
                    expectRecvd(p, new PlayerStatus(shooter)) // lose robbery
                    expectRecvd(p, new PlayerStatus(target)) // unseat
                }
                expect(target.seated).toBe(false)
            }
            if (G.seated.length === 1) {
                expect(G.state).toBe("RoundCeremony")
                for (const p of players) {
                    expectRecvd(p, new RoundWinner(G.seated[0]))
                }
            } else {
                const maximum = Math.min(
                    originalBalance[shooter.index] + loot,
                    G.bet,
                )
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
    for (const p of players) {
        expectRecvd(p, new GameOver())
    }
})

// test<GameTestContext>("Designated BetSetup", ({ G, players }) => {
//     expect(G.state).toBe("BetSetup")
//     const defaultBetAmount = G.bet
//     const cmd = dispatchCmd({
//         tag: "SetBet",
//         amount: Math.floor(((G.betWindow[0] + G.betWindow[1]) * 2) / 3),
//     })
//     // no effect
//     for (const p of players) if (p !== G.currentPlayer) cmd.exec(p)
//     expect(G.state).toBe("BetSetup")
//     expect(G.bet).toBe(defaultBetAmount)
//     // effective
//     cmd.exec(G.currentPlayer!)
//     expect(G.bet).not.toBe(defaultBetAmount)
//     expect(G.bet).toBe(cmd.amount)
//     expect(G.state).toBe("Turn")
//     // draw card to peacefully end turn and test the bet set by the cmd.
//     const drawing = G.currentPlayer!
//     const originalBalance = drawing.balance
//     G.drawCard(drawing)
//     expect(drawing.balance).toBe(originalBalance - cmd.amount)
// })

// test<GameTestContext>("Designated Shot", ({ G, players }) => {
//     G.setBet(G.defaultBetAmount)
//     const shooter = G.currentPlayer!
//     shooter.accuracy = 1
//     const target =
//         G.seated[(G.seated.indexOf(shooter) + G.turnOrder) % G.seated.length]
//     expect(G.whoPlaysNext).toBe(target)
//     const nextShooter =
//         G.seated[(G.seated.indexOf(target) + G.turnOrder) % G.seated.length]
//     const originalStakes = G.stakes
//     for (const p of players) p.clearEventQ()
//     G.shoot(shooter, target)
//     expect(target.seated).toBe(false)
//     for (const p of players) {
//         expect(p.earliestEvent).toStrictEqual(new PlayerShot(shooter, target))
//         expect(p.earliestEvent).toStrictEqual(new PlayerStatus(target)) // withdraw
//         expect(p.earliestEvent).toStrictEqual(new PlayerStatus(shooter)) // deposit
//         expect(p.earliestEvent).toStrictEqual(new PlayerStatus(shooter)) // lose robbery
//         expect(p.earliestEvent).toStrictEqual(new PlayerStatus(target)) // unseat
//         expect(p.earliestEvent).toStrictEqual(new PlayerStatus(shooter)) // withdraw bet
//         expect(p.earliestEvent).toStrictEqual(
//             new Stakes(originalStakes + G.bet),
//         ) // add bet
//         if (shooter.bankrupt)
//             expect(p.earliestEvent).toStrictEqual(new PlayerStatus(shooter)) // unseat
//         expect(p.earliestEvent).toStrictEqual(new NowTurnOf(nextShooter))
//         expect(p.earliestEvent).toStrictEqual(new PlayerStatus(nextShooter)) // unset lastDitch
//     }
// })

// test<GameTestContext>("Drift: increment", ({ G, players }) => {
//     for (const p of players) {
//         p.clearEventQ()
//     }
//     for (const p of players) {
//         p.setDrift(1)
//         p.setBuff(Mediation)
//         expect(p.drift).toBe(1)
//     }
//     G.setBet(0)
//     let count = 0
//     console.log("==========================")
//     // while (!players.every(p => p.accuracy === Player.ACCURACY_MAX)) {
//     //     G.drawCard(G.currentPlayer!)
//     //     console.log(count++)
//     // }
// }) // All we do here is wait until it escapes the while loop.

// test<GameTestContext>("Drift: decrement", ({ G, players }) => {
//     for (const p of players) {
//         p.clearEventQ()
//     }
//     for (const p of players) {
//         p.setDrift(-1)
//         p.setBuff(Mediation)
//         expect(p.drift).toBe(-1)
//     }
//     G.setBet(0)
//     let count = 0
//     console.log(1234)
//     // while (!players.every(p => p.accuracy === Player.ACCURACY_MIN)) {
//     //     G.drawCard(G.currentPlayer!)
//     //     console.log(count++)
//     // }
// }) // All we do here is wait until it escapes the while loop.

// // TODO: how to test Drift 0 (stable) ?
