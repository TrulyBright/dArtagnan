export type Drift = -1 | 0 | 1

export const isDrift = (value: unknown): value is Drift =>
    value === -1 || value === 0 || value === 1

const drifts = [-1, 0, 1] as const satisfies Drift[]
export const randomDrift = (): Drift => drifts[Math.floor(Math.random() * drifts.length)]