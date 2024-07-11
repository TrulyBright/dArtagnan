import { Code } from "#code"

export class NoSuchRoom extends Error {
    constructor(readonly code: Code) {
        super(`No room with code ${code}`)
    }
}