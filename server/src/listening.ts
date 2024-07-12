export type Listener<T> = (e: T) => void

export class Listening<T> {
    protected readonly listeners: Listener<T>[] = []
    recv(e: T) {
        this.listeners.forEach(l => l(e))
    }
    addListener(l: Listener<T>) {
        this.listeners.push(l)
        return this
    }
    removeListener(l: Listener<T>) {
        const i = this.listeners.indexOf(l)
        if (i === -1) throw new Error("Listener not found")
        this.listeners.splice(i, 1)
    }
}