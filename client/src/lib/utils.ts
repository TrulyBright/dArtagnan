export const whichSprite = (index: number, count: number) => {
    switch (index) {
        case 0: return index
        case 1: return count < 5 ? 6 - count : index
        case 2:
            if (count < 6) return 8 - count
            if (count < 8) return 9 - count
            return index
        case 3:
            if (count < 8) return 10 - count
            return index
        case 4:
            if (count === 5) return 7
            if (count === 6) return 5
            if (count === 7) return 5
            return index
        case 5:
            if (count === 6) return 7
            if (count === 7) return 6
            return index
        case 6:
            if (count === 7) return 7
            return index
        case 7: return index
        default: return index
    }
}