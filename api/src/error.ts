import type { Code } from "#code"

export class NoSuchRoom extends Error {
    constructor(readonly code: Code) {
        super(`No room with code ${code}`)
    }
}

export class RoomFull extends Error {
    constructor() {
        super("Room is full")
    }
}
