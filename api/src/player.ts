import type { Buff } from "#card"
import type { Drift } from "#drift"

export type PlayerBase = {
    readonly index: number
    readonly seated: boolean
    readonly balance: number
    readonly accuracy: number
    readonly buff: Record<Buff["tag"], boolean>
    readonly bankrupt: boolean
    readonly drift: Drift
}
