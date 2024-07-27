import { Game } from "#game"
import { Player } from "#player"
import { Room } from "#room"
import { BetSetupStart, NewRound } from "@dartagnan/api/event"
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
    const players = Array.from({ length: Room.MAX_MEMBERS }, (_, i) => new Player(i))
    for (const p of players) {
        G.addPlayer(p)
        G.addbroadcaster(p.recv.bind(p))
    }
    expect(G.state).toBe(Idle)
    G.start()
    expect(G.state).toBe(BetSetup)
    expect(G.currentPlayer).toBe(players[0])
    for (const p of players) {
        expect(p.earliestEvent).toStrictEqual(new NewRound(1))
        expect(p.earliestEvent).toStrictEqual(new BetSetupStart(players[0]))
    }
})