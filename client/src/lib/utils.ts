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

export const calculatePositions = (count: number) => {
    const positions = []
    const center = 50
    const radius = 40
    for (let i = 0; i < count; i++) {
        const angle = (2 * Math.PI / count) * i + Math.PI / 2
        const x = center + radius * Math.cos(angle)
        const y = center + radius * Math.sin(angle)
        positions.push({ x, y })
    }
    return positions
}