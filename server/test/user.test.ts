import { beforeEach, test, expect } from "vitest"
import { Hub } from "#hub"
import { CodeRegex } from "@dartagnan/api/code"
import { Room } from "#room"
import { dispatchCmd } from "#action"
import {
    NeedToBeHost,
    NoSuchRoom,
    RoomFull,
    Unstartable,
} from "@dartagnan/api/error"
import { createExpector, RecvExpector, uGen } from "#test/common"
import { User } from "#user"

type UserTestContext = {
    H: Hub
    users: User[]
    expectRecvd: RecvExpector
}

beforeEach<UserTestContext>(async context => {
    context.H = new Hub()
    context.users = Array.from({ length: 100 }, uGen)
    context.expectRecvd = createExpector(context.users).expectRecvd
})

test<UserTestContext>("User creates, enters, speaks in, and leaves a room", ({
    H,
    users,
    expectRecvd,
}) => {
    // Create
    const host = users[0]
    H.addUser(host, null)
    expectRecvd(host, { tag: "UserEntered", user: host })
    expectRecvd(host, { tag: "NewHost", host: host })
    const room = host.room!
    expect(room).not.toBeNull()
    expect(room.users).toEqual([host])
    expect(room.code).toMatch(CodeRegex)
    expect(room.startable).toBe(false)
    expect(room.playing).toBe(false)
    // Enter
    const guests = users
        .filter(u => u !== host)
        .slice(0, Room.MAX_MEMBERS - room.users.length)
    for (const g of guests) {
        H.addUser(g, room.code)
        for (const o of room.users)
            expectRecvd(o, { tag: "UserEntered", user: g })
        const msg = g.name + "speaks!"
        const cmd = dispatchCmd({
            tag: "Speak",
            message: msg,
        })
        if (!cmd.isUserCmd) throw new Error("CSpeak not usercmd")
        cmd.exec(g)
        for (const o of room.users)
            expectRecvd(o, { tag: "UserSpoke", message: msg, user: g })
    }
    expect(room.full).toBe(true)
    const latecomer = uGen()
    expect(() => H.addUser(latecomer, room.code)).toThrowError(new RoomFull())
    // Leave
    for (const leaver of room.users.slice()) {
        H.removeUser(leaver)
        for (const remaining of room.users) {
            expectRecvd(remaining, { tag: "UserLeft", user: leaver })
            expectRecvd(remaining, { tag: "NewHost", host: room.users[0] })
        }
    }
    expect(room.empty).toBe(true)
    expect(() => H.addUser(uGen(), room.code)).toThrow(
        new NoSuchRoom(room.code),
    )
})

test<UserTestContext>("Host can start a game while guests cannot.", ({ H }) => {
    const cmd = dispatchCmd({ tag: "StartGame" })
    if (!cmd.isUserCmd) throw new Error(`StartGame not isUserCmd`)
    const host = uGen()
    H.addUser(host, null)
    expect(() => cmd.exec(host)).toThrowError(new Unstartable())
    const guests = Array.from(
        { length: Room.MAX_MEMBERS - host.room!.users.length },
        uGen,
    )
    for (const g of guests) H.addUser(g, host.room!.code)
    expect(host.room!.startable).toBe(true)
    for (const g of guests)
        expect(() => cmd.exec(g)).toThrowError(new NeedToBeHost())
    cmd.exec(host)
    expect(host.room!.playing).toBe(true)
})
