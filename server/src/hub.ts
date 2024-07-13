import { type Code, randomCode } from "@dartagnan/api/code"
import { NoSuchRoom, RoomFull } from "@dartagnan/api/error"
import { Room } from "#room"
import type { User } from "#user"

export class Hub {
    private readonly rooms: Record<Code, Room> = {}
    /**
     *
     * @throws {NoSuchRoom} if no room with such code exists
     * @throws {RoomFull} if the room is full
     */
    addUser(u: User, code: Code | null) {
        let r: Room
        if (code === null) r = new Room(randomCode())
        else if (!this.rooms[code]) throw new NoSuchRoom(code)
        else if (this.rooms[code].full) throw new RoomFull()
        else r = this.rooms[code]
        r.addUser(u)
        u.setRoom(r)
        if (r.users.length === 1) r.setHost(u)
        this.rooms[r.code] = r
    }
    removeUser(u: User) {
        const r = u.room
        if (!r) return
        r.removeUser(u)
        u.unsetRoom()
        if (r.empty) delete this.rooms[r.code]
        else if (r.host === u) r.setHost(r.users[0])
    }
}
