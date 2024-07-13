import { PlayerBase } from "#player"

export type Buff =
    | 'Insurance'
    | 'Bulletproof'

export type OneOff =
    | 'Sharpshooter'

export type Card = Buff | OneOff

export const BuffStatusReset: PlayerBase['buff'] = {
    Insurance: false,
    Bulletproof: false,
} as const