import { beforeEach, test, expect } from "vitest"
import { Hub } from "#hub"
import { CodeRegex } from "@dartagnan/api/code"
import { Room } from "#room"
import { NewHost, UserEntered, UserLeft, UserSpoke } from "@dartagnan/api/event"
import { dispatchCmd } from "#action"
import { NeedToBeHost, NoSuchRoom, RoomFull, Unstartable } from "@dartagnan/api/error"
import { User } from "#user"
import { isUsername, Username } from "@dartagnan/api/user"

let H: Hub
beforeEach(() => {
    H = new Hub()
})

const unameGen = (): Username => {
    const s = Math.floor(Math.random() * 100).toString(36)
    if (isUsername(s)) return s
    throw new Error(`Invalid Username: ${s}`)
}

const uGen = () => new User(unameGen())

test("User creates, enters, speaks in, and leaves a room", () => {
    // Create
    const host = uGen()
    H.addUser(host, null)
    expect(host.earliestEvent).toStrictEqual(new UserEntered(host))
    expect(host.earliestEvent).toStrictEqual(new NewHost(host))
    const room = host.room!
    expect(room).not.toBeNull()
    expect(room.users).toEqual([host])
    expect(room.code).toMatch(CodeRegex)
    expect(room.startable).toBe(false)
    expect(room.playing).toBe(false)

    // Enter
    const guests = Array.from({ length: Room.MAX_MEMBERS - room.users.length }, uGen)
    for (const g of guests) {
        H.addUser(g, room.code)
        for (const o of room.users)
            expect(o.earliestEvent).toStrictEqual(new UserEntered(g))
        const msg = g.name + 'speaks!'
        const cmd = dispatchCmd({
            tag: 'Speak',
            message: msg
        })
        if (!cmd.isUserCmd) throw new Error('CSpeak not usercmd')
        cmd.exec(g)
        for (const o of room.users)
            expect(o.earliestEvent).toStrictEqual(new UserSpoke(msg, g))
        for (const outsider of guests.filter(g => !room.users.includes(g)))
            expect(outsider.gotNoEvent).toBe(true)
    }
    expect(room.full).toBe(true)
    const latecomer = uGen()
    expect(() => H.addUser(latecomer, room.code)).toThrowError(new RoomFull())

    // Leave
    for (const leaver of room.users.slice()) {
        H.removeUser(leaver)
        for (const remaining of room.users) {
            expect(remaining.earliestEvent).toStrictEqual(new UserLeft(leaver))
            expect(remaining.earliestEvent).toStrictEqual(new NewHost(room.users[0]))
        }
    }
    expect(room.empty).toBe(true)
    expect(() => H.addUser(uGen(), room.code)).toThrow(new NoSuchRoom(room.code))
})

test("Host can start a game while guests cannot.", () => {
    const cmd = dispatchCmd({ tag: 'StartGame' })
    if (!cmd.isUserCmd) throw new Error(`StartGame not isUserCmd`)
    const host = uGen()
    H.addUser(host, null)
    expect(() => cmd.exec(host)).toThrowError(new Unstartable())
    const guests = Array.from({ length: Room.MAX_MEMBERS - host.room!.users.length }, uGen)
    for (const g of guests) H.addUser(g, host.room!.code)
    expect(host.room!.startable).toBe(true)
    for (const g of guests) expect(() => cmd.exec(g)).toThrowError(new NeedToBeHost())
    cmd.exec(host)
    expect(host.room!.playing).toBe(true)
})