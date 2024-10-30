import { Bulletproof, Curse, Insurance, Sharpshooter, type Card } from "@dartagnan/api/card"

export type Locales = {
    [lang: string]: Locale
}
export type Locale = {
    card: Record<Card["tag"], CardLocale>
}

export type CardLocale = {
    name: string
    description: string
}

export default {
    ko: {
        card: {
            [Bulletproof.tag]: {
                name: "방탄 조끼",
                description: `${Bulletproof.cost}달러를 지불합니다. 피격에 1회 면역이 됩니다. (중첩 불가)`
            },
            [Curse.tag]: {
                name: "저주",
                description: `내가 겨눈 대상의 명중률이 ${Curse.accuracy * 100}%가 됩니다.`
            },
            [Insurance.tag]: {
                name: "보험",
                description: `${Insurance.premium}달러를 지불합니다. 사망 시 ${Insurance.payout}달러를 받습니다. (중첩 불가)`
            },
            [Sharpshooter.tag]: {
                name: "명사수",
                description: `명중률이 ${Sharpshooter.accuracy * 100}%가 됩니다.`
            }
        }
    }
} as const satisfies Locales