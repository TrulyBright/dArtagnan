import { Game } from "#game"
import { Player } from "#player"
import { Room } from "#room"
import { BetSetupStart, NewRound, PlayerStatus } from "@dartagnan/api/event"
import { State } from "@dartagnan/api/game"
import { expect, test } from "vitest"

const Idle: State = "Idle"
const RoundInit: State = "RoundInit"
const BetSetup: State = "BetSetup"
const RoundCeremony: State = "RoundCeremony"
const Turn: State = "Turn"
const GameOver: State = "GameOver"

test("Game overall", () => {
    const G = new Game()
    const players = Array.from({ length: Game.MIN_PLAYERS }, (_, i) => new Player(i, G))
    for (const p of players) {
        G.addPlayer(p)
        G.addbroadcaster(p.recv.bind(p))
    }
    expect(G.state).toBe(Idle)
    G.start()
    for (const p of players) {
        expect(p.earliestEvent).toStrictEqual(new NewRound(1))
        for (const other of players) {
            expect(p.earliestEvent).toStrictEqual(new PlayerStatus(other))
        }
    }
    // expect(G.state).toBe(BetSetup)
    // expect(G.currentPlayer).toBe(players[0])
    // for (const p of players) {
    //     expect(p.earliestEvent).toStrictEqual(new NewRound(1))
    //     expect(p.earliestEvent).toStrictEqual(new BetSetupStart(players[0]))
    // }
})