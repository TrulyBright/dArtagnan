import type { UserBase, Username } from "@dartagnan/api/user"

export default class User implements UserBase {
    constructor(
        readonly id: number,
        readonly name: Username,
        readonly index: number
    ) {}
}