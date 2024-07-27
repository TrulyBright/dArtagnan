import { User } from "#user"
import { Event } from "@dartagnan/api/event"
import { isUsername } from "@dartagnan/api/user"

export class TestUser extends User {
    readonly Q = new Queue<Event>()
    constructor(username: string) {
        if (!isUsername(username)) throw new Error("Invalid username")
        super(username)
        this.addListener(this.Q.push.bind(this.Q))
    }
}

class Queue<T> {
    private readonly items: T[] = []
    push(item: T) { this.items.push(item) }
    pop(): T {
        const popped = this.items.shift()
        if (popped === undefined) throw new Error("Queue is empty")
        return popped
    }
    get length() { return this.items.length }
    get empty() { return this.items.length === 0 }
}