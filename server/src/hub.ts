import type { Code } from "@dartagnan/api/code"
import { NoSuchRoom } from "@dartagnan/api/error"
import type { Room } from "#room"
import type { User } from "#user"

export class Hub {
    private readonly rooms: Record<Code, Room> = {}
    /**
     *
     * @throws {NoSuchRoom} if no room with such code exists
     */
    addUser(u: User, code: Code | null) {}
}
