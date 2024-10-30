import { Bulletproof, Curse, Destroy, Donation, Insurance, LastDitch, Mediation, Reverse, Robbery, Run, Sharpshooter, type Card } from "@dartagnan/api/card"

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
                name: "방탄복",
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
            },
            [Robbery.tag]: {
                name: "강도",
                description: `대상을 사살할 때 빼앗는 금액이 ${Robbery.multiplier}배가 됩니다. (1회 한정)`
            },
            [Run.tag]: {
                name: "도주",
                description: `판돈의 ${Run.share * 100}%를 들고 이번 라운드에서 도주합니다.`
            },
            [Destroy.tag]: {
                name: "파괴",
                description: `모든 플레이어가 손에 쥔 카드를 잃습니다.`
            },
            [Mediation.tag]: {
                name: "명상",
                description: `명중률 증감폭의 오차가 사라집니다.`
            },
            [Reverse.tag]: {
                name: "역방향",
                description: `순서가 반대로 돌아갑니다.`
            },
            [LastDitch.tag]: {
                name: "발악",
                description: `내 차례가 한번 더 오지만, 명중률이 ${LastDitch.penalty * 100}% 감소합니다.`
            },
            [Donation.tag]: {
                name: "후원",
                description: `즉시 ${Donation.amount}달러를 받습니다.`
            }
        }
    }
} as const satisfies Locales