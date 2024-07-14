type Tagged<T extends string> = {
    readonly tag: T
    [k: string]: unknown
}

export const Insurance = {
    tag: "Insurance",
    premium: 10,
    payout: 80,
} as const satisfies Tagged<"Insurance">

export const Bulletproof = {
    tag: "Bulletproof",
    cost: 7,
} as const satisfies Tagged<"Bulletproof">

export const Curse = {
    tag: "Curse",
    accuracy: 0.1,
} as const satisfies Tagged<"Curse">

export const Robbery = {
    tag: "Robbery",
    multiplier: 4,
} as const satisfies Tagged<"Robbery">

export const Mediation = {
    tag: "Mediation",
} as const satisfies Tagged<"Mediation">

export const LastDitch = {
    tag: "LastDitch",
    penalty: 0.25,
} as const satisfies Tagged<"LastDitch">

export const Sharpshooter = {
    tag: "Sharpshooter",
    accuracy: 0.9,
} as const satisfies Tagged<"Sharpshooter">

export const Reverse = {
    tag: "Reverse",
} as const satisfies Tagged<"Reverse">

export const Run = {
    tag: "Run",
    share: 0.2,
} as const satisfies Tagged<"Run">

export const Donation = {
    tag: "Donation",
    amount: 50,
} as const satisfies Tagged<"Donation">

export const Destroy = {
    tag: "Destroy",
} as const satisfies Tagged<"Destroy">

export type Buff =
    | typeof Insurance
    | typeof Bulletproof
    | typeof Curse
    | typeof Robbery
    | typeof Mediation
    | typeof LastDitch

export type OneOff =
    | typeof Sharpshooter
    | typeof Reverse
    | typeof Run
    | typeof Donation
    | typeof Destroy

export type Card = Buff | OneOff
