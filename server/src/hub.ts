import { Code } from "@api/code"
import { User } from "./user"
import { Room } from "./room"
import { NoSuchRoom } from "@api/error"

export class Hub {
    private readonly rooms: Record<Code, Room> = {}
    /**
     * 
     * @throws {NoSuchRoom} if no room with such code exists
     */
    addUser(u: User, code: Code | null) {
        
    }
}