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
}