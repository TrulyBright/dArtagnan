export const CARD_CONSTS = {
    INSURANCE_PREMIUM: 10,
    INSURANCE_PAYOUT: 100,
    BULLETPROOF_COST: 7,
    CURSE_ACCURACY: 0.1,
    ROBBERY_MULTIPLIER: 4,
    DONATION_AMOUNT: 50,
    LAST_DITCH_PENALTY: 0.25,
    SHARPSHOOTER_ACCURACY: 0.9,
    RUN_SHARE: 0.20,
}
export type Buff =
    | "Insurance" // Pay premium to get payout on death.
    | "Bulletproof" // Pay to be immune to the next shot.
    | "Curse" // The target's accuracy becomes very low.
    | "Robbery" // Take over few times more from the target's balance.
    | "Mediation" // The drift is no longer errorneous.
    | "LastDitch" // Lower your accuracy to get one more turn.

export type OneOff =
    | "Sharpshooter" // Your accuracy becomes very high.
    | "Reverse" // The turn order is reversed.
    | "Run" // Steal some of the stakes and run away from the game.
    | "Donation" // Instantly get some money.
    | "Destroy" // Destroy the card of every player.

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
    "Reverse",
    "Run",
    "Donation",
    "Destroy",
    "Mediation",
    "LastDitch",    
] as const

export const randomCard = (): Card =>
    CardPool[Math.floor(Math.random() * CardPool.length)]

export const BuffStatusReset: Record<Buff, false> = {
    Insurance: false,
    Bulletproof: false,
    Curse: false,
    Robbery: false,
    Mediation: false,
    LastDitch: false,
} as const
