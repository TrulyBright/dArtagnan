import { Buff } from "#card"
import { Drift } from "#drift"

export type PlayerBase = {
    readonly index: number
    readonly seated: boolean
    readonly balance: number
    readonly accuracy: number
    readonly buff: Record<Buff, boolean>
    readonly bankrupt: boolean
    readonly drift: Drift
}
