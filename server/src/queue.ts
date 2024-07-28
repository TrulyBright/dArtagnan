import type { Event } from "@dartagnan/api/event"
import { Listening } from "#listening"

export class Queue<Item> {
    constructor(readonly size: number) {}
    private readonly Q: Item[] = []
    push(i: Item) {
        this.Q.push(i)
    }
    pop() {
        return this.Q.shift()
    }
    get length() {
        return this.Q.length
    }
    get empty() {
        return this.Q.length === 0
    }
    get full() {
        return this.Q.length >= this.size
    }
}

export abstract class EnqueueOnEvent extends Listening<Event> {
    static readonly Q_SIZE = 10
    protected EventQ = new Queue<Event>(EnqueueOnEvent.Q_SIZE)
    constructor() {
        super()
        this.addListener(this.EventQ.push.bind(this.EventQ))
    }
    /** return the earliest of the last `Q_SIZE` events. */
    get earliestEvent() {
        return this.EventQ.pop()
    }
    get gotNoEvent() {
        return this.earliestEvent === undefined
    }
    /** return the earliest event that is not `e`, or undefined if it's not there. */
    skipped(e: Event) {
        let earliest = this.earliestEvent
        while (earliest === e) earliest = this.earliestEvent
        return earliest
    }
}
