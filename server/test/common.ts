import { Listening } from "#listening"
import { User } from "#user"
import { Event } from "@dartagnan/api/event"
import { type Username, isUsername } from "@dartagnan/api/user"
import { expect, vi } from "vitest"

const unameGen = (): Username => {
    const s = Math.floor(Math.random() * 100).toString(36)
    if (isUsername(s)) return s
    throw new Error(`Invalid Username: ${s}`)
}

export const uGen = () => new User(unameGen())

export const createExpector = (receivers: Listening<Event>[]) => {
    type R = (typeof receivers)[number]
    const spies = receivers.map(r => ({
        receiver: r,
        spy: vi.spyOn(r, "recv"),
    }))
    const spy = (r: R) => spies.find(s => s.receiver === r)!.spy
    const recvCnts = receivers.map(r => ({ receiver: r, count: 0 }))
    const getRecvCnt = (r: R) => ++recvCnts.find(c => c.receiver === r)!.count
    const expectRecvd = (r: R, e: Event) =>
        expect(spy(r)).toHaveBeenNthCalledWith(getRecvCnt(r), e)
    const clearExpector = (r: R) => {
        recvCnts.find(c => c.receiver === r)!.count = 0
        spies.find(s => s.receiver === r)!.spy.mockClear()
    }
    return {
        expectRecvd: expectRecvd,
        clearExpector: clearExpector,
    }
}

export type RecvExpector = ReturnType<typeof createExpector>["expectRecvd"]
export type ClearExpector = ReturnType<typeof createExpector>["clearExpector"]
