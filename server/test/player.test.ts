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
    CardPlayed,
    TurnOrder,
} from "@dartagnan/api/event"
import { beforeEach, expect, test, vi } from "vitest"
import { ClearExpector, createExpector, RecvExpector } from "./common"
import { dispatchCmd } from "#action"
import {
    Bulletproof,
    Curse,
    Destroy,
    Donation,
    Insurance,
    LastDitch,
    Mediation,
    Reverse,
    Robbery,
    Run,
    Sharpshooter,
} from "@dartagnan/api/card"
import { randomCard } from "#card"

type GameTestContext = {
    G: Game
    players: Player[]
    expectRecvd: RecvExpector
    clearExpector: ClearExpector
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
    const { expectRecvd, clearExpector } = createExpector(players)
    context.expectRecvd = expectRecvd
    context.clearExpector = clearExpector
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
                if (G.seated.length === 1) {
                    expect(G.state).toBe("RoundCeremony")
                    for (const p of players)
                        expectRecvd(p, new RoundWinner(G.seated[0]))
                    break
                }
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

// TODO: how to test Drift 0 (stable) ?

test<GameTestContext>(`Card: ${Sharpshooter.tag}`, ({
    G,
    players,
    expectRecvd,
    clearExpector,
}) => {
    G.setBet(0)
    const playing = G.currentPlayer!
    playing.setAccuracy(Player.ACCURACY_MIN)
    expect(playing.accuracy).not.toBe(Sharpshooter.accuracy)
    playing.getCard(Sharpshooter)
    for (const p of players) clearExpector(p)
    G.playCard(playing)
    expectRecvd(playing, new YourCard(null))
    for (const p of players) expectRecvd(p, new CardPlayed(Sharpshooter))
    expect(playing.accuracy).toBe(Sharpshooter.accuracy)
    for (const p of players) expectRecvd(p, new PlayerStatus(playing))
})

test<GameTestContext>(`Card: ${Reverse.tag}`, ({
    G,
    players,
    expectRecvd,
    clearExpector,
}) => {
    G.setBet(0)
    const originalOrder = G.turnOrder
    const reversed: Game["turnOrder"] = originalOrder === 1 ? -1 : 1
    const playing = G.currentPlayer!
    const whoOriginallyPlaysNext = G.whoPlaysNext
    const theOtherSide =
        G.seated[
            (G.seated.indexOf(playing)! + reversed + G.seated.length) %
                G.seated.length
        ]
    playing.getCard(Reverse)
    for (const p of players) clearExpector(p)
    G.playCard(playing)
    expectRecvd(playing, new YourCard(null))
    expect(G.turnOrder).toBe(reversed)
    for (const p of players) {
        expectRecvd(p, new CardPlayed(Reverse))
        expectRecvd(p, new TurnOrder(reversed))
    }
    expect(G.whoPlaysNext).not.toBe(whoOriginallyPlaysNext)
    expect(G.whoPlaysNext).toBe(theOtherSide)
    G.drawCard(playing)
    expect(G.currentPlayer!).toBe(theOtherSide)
})

test<GameTestContext>(`Card: ${Donation.tag}`, ({ G }) => {
    G.setBet(0)
    const playing = G.currentPlayer!
    playing.getCard(Donation)
    const originalBalance = playing.balance
    const spy = vi.spyOn(playing, "deposit")
    G.playCard(playing)
    expect(playing.balance).toBe(originalBalance + Donation.amount)
    expect(spy).toHaveBeenCalledWith(Donation.amount)
})

test<GameTestContext>(`Card: ${Destroy.tag}`, ({
    G,
    players,
    expectRecvd,
    clearExpector,
}) => {
    G.setBet(0)
    for (const p of players) p.getCard(randomCard())
    const playing = G.currentPlayer!
    playing.getCard(Destroy)
    for (const p of players) clearExpector(p)
    G.playCard(playing)
    expectRecvd(playing, new YourCard(null)) // play hence null.
    for (const p of players) {
        expectRecvd(p, new CardPlayed(Destroy))
        expectRecvd(p, new YourCard(null))
    }
})

test<GameTestContext>(`Card: ${Run.tag}`, ({
    G,
    players,
    expectRecvd,
    clearExpector,
}) => {
    G.setBet(G.defaultBetAmount)
    G.drawCard(G.currentPlayer!)
    G.currentPlayer!.getCard(Run)
    for (const p of players) clearExpector(p)
    const running = G.currentPlayer!
    const originalStakes = G.stakes
    const originalBalance = running.balance
    G.playCard(running)
    expectRecvd(running, new YourCard(null))
    for (const p of players) {
        expectRecvd(p, new CardPlayed(Run))
        expectRecvd(p, new PlayerStatus(running))
    }
    expect(G.seated).not.include(running)
    const taken = Math.floor(originalStakes * Run.share)
    expect(running.balance).toBe(originalBalance + taken)
    expect(G.stakes).toBe(originalStakes - taken)
})

test<GameTestContext>(`Card: ${Insurance.tag}`, ({ G }) => {
    G.setBet(G.defaultBetAmount)
    const playing = G.currentPlayer!
    const spyWithdraw = vi.spyOn(playing, "withdraw")
    const spyDeposit = vi.spyOn(playing, "deposit")
    const originalBalance = playing.balance
    playing.getCard(Insurance)
    G.playCard(playing)
    expect(spyWithdraw).toHaveBeenNthCalledWith(1, Insurance.premium)
    G.drawCard(playing)
    G.currentPlayer!.accuracy = 1
    G.shoot(G.currentPlayer!, playing)
    expect(playing.seated).toBe(false)
    expect(spyDeposit).toHaveBeenNthCalledWith(1, Insurance.payout)
    expect(playing.balance).toBe(
        originalBalance -
            Insurance.premium -
            G.bet - // bet
            G.bet + // loot
            Insurance.payout,
    )
})

test<GameTestContext>(`Card: ${Bulletproof.tag}`, ({ G }) => {
    G.setBet(0)
    const shot = G.currentPlayer!
    const shooting = G.whoPlaysNext
    const originalBalance = shot.balance
    const spyWithdraw = vi.spyOn(shot, "withdraw")
    shot.getCard(Bulletproof)
    G.playCard(shot)
    expect(spyWithdraw).toHaveBeenNthCalledWith(1, Bulletproof.cost)
    expect(shot.balance).toBe(originalBalance - Bulletproof.cost)
    G.drawCard(shot)
    shooting.accuracy = 1
    G.shoot(shooting, shot)
    expect(shot.seated).toBe(true)
    expect(shot.buff.Bulletproof).toBe(false)
})

test<GameTestContext>(`Card: ${Curse.tag}`, ({ G }) => {
    G.setBet(0)
    const cursing = G.currentPlayer!
    const cursed = G.whoPlaysNext
    cursed.setBuff(Mediation)
    cursed.setDrift(0)
    cursing.getCard(Curse)
    G.playCard(cursing)
    expect(cursing.buff.Curse).toBe(true)
    expect(cursed.accuracy).not.toBe(Curse.accuracy)
    G.shoot(cursing, cursed)
    expect(cursed.accuracy).toBe(Curse.accuracy)
    expect(cursing.buff.Curse).toBe(false)
})

test<GameTestContext>(`Card: ${Robbery.tag}`, ({ G }) => {
    G.setBet(G.defaultBetAmount)
    const robbing = G.currentPlayer!
    const robbed = G.whoPlaysNext
    const originalBalanceRobbing = robbing.balance
    const originalBalanceRobbed = robbed.balance
    robbing.getCard(Robbery)
    G.playCard(robbing)
    expect(robbing.buff.Robbery).toBe(true)
    robbing.accuracy = 1
    G.shoot(robbing, robbed)
    expect(robbed.seated).toBe(false)
    expect(robbing.balance).toBe(
        originalBalanceRobbing + G.bet * Robbery.multiplier - G.bet,
    )
    expect(robbed.balance).toBe(
        originalBalanceRobbed -
            G.bet * Robbery.multiplier +
            (robbed.buff.Insurance ? Insurance.payout : 0),
    )
    expect(robbing.buff.Robbery).toBe(false)
})

test<GameTestContext>(`Card: ${LastDitch.tag}`, ({ G }) => {
    G.setBet(G.defaultBetAmount)
    const ditching = G.currentPlayer!
    const originalAccuracy = ditching.accuracy
    expect(originalAccuracy).toBeGreaterThan(LastDitch.penalty) // it can result in intended failure.
    ditching.getCard(LastDitch)
    G.playCard(ditching)
    expect(ditching.buff.LastDitch).toBe(true)
    expect(ditching.accuracy).toBe(originalAccuracy - LastDitch.penalty)
    G.shoot(ditching, G.whoPlaysNext)
    expect(G.currentPlayer).toBe(ditching)
})
