type Tagged<T extends string> = { readonly tag: T }

export type Insurance = Tagged<"Insurance"> & {
    premium: 10
    payout: 80
}

export type Bulletproof = Tagged<"Bulletproof"> & {
    cost: 7
}

export type Curse = Tagged<"Curse"> & {
    accuracy: 0.1
}

export type Robbery = Tagged<"Robbery"> & {
    multiplier: 4
}

export type Mediation = Tagged<"Mediation">

export type LastDitch = Tagged<"LastDitch"> & {
    penalty: 0.25
}

export type Sharpshooter = Tagged<"Sharpshooter"> & {
    accuracy: 0.9
}

export type Reverse = Tagged<"Reverse">

export type Run = Tagged<"Run"> & {
    share: 0.2
}

export type Donation = Tagged<"Donation"> & {
    amount: 50
}

export type Destroy = Tagged<"Destroy">

export type Buff =
    | Insurance
    | Bulletproof
    | Curse
    | Robbery
    | Mediation
    | LastDitch

export type OneOff =
    | Sharpshooter
    | Reverse
    | Run
    | Donation
    | Destroy

export type Card = Buff | OneOff