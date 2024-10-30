import { Bulletproof, Curse, Insurance, Sharpshooter, type Card } from "@dartagnan/api/card"

export const colorOf = (c: Card) => {
    switch (c.tag) {
        case Bulletproof.tag:
            return "blue"
        case Curse.tag:
            return "purple"
        case Insurance.tag:
            return "green"
        case Sharpshooter.tag:
            return "red"
    }
}