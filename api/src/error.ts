import type { Code } from "#code"

export class NoSuchRoom extends Error {
    constructor(readonly code: Code) {
        super(`No room with code ${code}.`)
    }
}

export class RoomFull extends Error {
    constructor() {
        super("Room is full.")
    }
}

export class NeedToBeHost extends Error {
    constructor() {
        super("You need to be a host to perform the action.")
    }
}

export class Unstartable extends Error {
    constructor() {
        super("Game unstartable.")
    }
}
