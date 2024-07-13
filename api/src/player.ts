import { Buff } from "#card"

export type PlayerBase = {
    readonly index: number
    readonly seated: boolean
    readonly buff: Record<Buff, boolean>
}
