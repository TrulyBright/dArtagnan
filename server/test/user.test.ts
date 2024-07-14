import { beforeEach, test, expect } from "vitest"
import { TestUser } from "#test/common"
import { Hub } from "#hub"
import { CodeRegex } from "@dartagnan/api/code"

let H: Hub
beforeEach(() => {
    H = new Hub()
})

test("User creates, enter, leave a room", () => {
    const host = new TestUser("host")
    H.addUser(host, null)
    const room = host.room!
    expect(room).not.toBeNull()
    expect(room.users).toEqual([host])
    expect(room.code).toMatch(CodeRegex)
    expect(room.startable).toBe(false)
    expect(room.playing).toBe(false)
})