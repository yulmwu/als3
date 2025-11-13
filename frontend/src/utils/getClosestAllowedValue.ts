export const getClosestAllowedValue = (input: number, allowed: number[]): number => {
    if (allowed.includes(input)) {
        return input
    }

    let closest = allowed[0]
    let minDiff = Math.abs(input - closest)

    for (let i = 1; i < allowed.length; i++) {
        const diff = Math.abs(input - allowed[i])
        if (diff < minDiff) {
            minDiff = diff
            closest = allowed[i]
        }
    }

    return closest
}
