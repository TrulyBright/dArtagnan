import { beforeEach, test, expect } from "vitest"
import { TestUser } from "#test/common"
import { Hub } from "#hub"
import { CodeRegex } from "@dartagnan/api/code"
import { Room } from "#room"
import { NewHost, UserEntered } from "@dartagnan/api/event"

let H: Hub
beforeEach(() => {
    H = new Hub()
})

test("User creates, enter, leave a room", () => {
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
    const occupants = () => [host, ...guests].filter(room.users.includes.bind(room.users))
    for (const g of guests) {
        H.addUser(g, room.code)
        for (const o of occupants())
            expect(o.Q.pop()).toStrictEqual(new UserEntered(g))
    }
})