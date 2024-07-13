export const CARD_CONSTS = {
    INSURANCE_PREMIUM: 10,
    INSURANCE_PAYOUT: 100,
    BULLETPROOF_COST: 7,
    CURSE_ACCURACY: 0.1,
    ROBBERY_MULTIPLIER: 4,
}
export type Buff =
    | "Insurance" // Pay premium to get payout on death.
    | "Bulletproof" // Pay to be immune to the next shot.
    | "Curse" // The target's accuracy becomes very low.
    | "Robbery" // Take over few times more from the target's balance.

export type OneOff = "Sharpshooter"

export type Card = Buff | OneOff

/**
 * Cards that can appear in the game.
 * You can adjust the weight of each card by adding more of the same card.
 * That card will more likely to be drawn.
 * @readonly
 */
const CardPool: Array<Card> = [
    "Insurance",
    "Bulletproof",
    "Curse",
    "Robbery",
    "Sharpshooter",
] as const

export const randomCard = (): Card =>
    CardPool[Math.floor(Math.random() * CardPool.length)]

export const BuffStatusReset: Record<Buff, false> = {
    Insurance: false,
    Bulletproof: false,
    Curse: false,
    Robbery: false,
} as const
