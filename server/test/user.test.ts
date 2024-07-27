import { beforeEach, test, expect } from "vitest"
import { TestUser } from "#test/common"
import { Hub } from "#hub"
import { CodeRegex } from "@dartagnan/api/code"
import { Room } from "#room"
import { NewHost, UserEntered, UserSpoke } from "@dartagnan/api/event"
import { dispatchCmd } from "#action"
import { RoomFull } from "@dartagnan/api/error"

let H: Hub
beforeEach(() => {
    H = new Hub()
})

test("User creates, enters, speaks in, leaves a room", () => {
    const host = new TestUser("host")
    H.addUser(host, null)
    expect(host.Q.pop()).toStrictEqual(new UserEntered(host))
    expect(host.Q.pop()).toStrictEqual(new NewHost(host))
    const room = host.room!
    expect(room).not.toBeNull()
    expect(room.users).toEqual([host])
    expect(room.code).toMatch(CodeRegex)
    expect(room.startable).toBe(false)
    expect(room.playing).toBe(false)
    const guests = Array.from({ length: Room.MAX_MEMBERS - room.users.length }, (_, i) => new TestUser(`guest${i}`))
    const occupants = () => [host, ...guests].filter(u => room.users.includes(u))
    for (const g of guests) {
        H.addUser(g, room.code)
        for (const o of occupants())
            expect(o.Q.pop()).toStrictEqual(new UserEntered(g))
        const msg = g.name + 'speaks!'
        const cmd = dispatchCmd({
            tag: 'Speak',
            message: msg
        })
        if (!cmd.isUserCmd) throw new Error('CSpeak not usercmd')
        cmd.exec(g)
        for (const o of occupants())
            expect(o.Q.pop()).toStrictEqual(new UserSpoke(msg, g))
        for (const outsider of guests.filter(g => !room.users.includes(g)))
            expect(outsider.Q.empty).toBe(true)
    }
    expect(room.full).toBe(true)
    const latecomer = new TestUser(`late`)
    expect(() => H.addUser(latecomer, room.code)).toThrowError(new RoomFull())
})