import * as fs from 'fs'

export function loadContributions(filePath: string) {
    let items = []
    const csv = fs.readFileSync(filePath)
    // skip header
    csv.toString().split('\n').slice(1).forEach(line => {
        let item = parseContribution(line)
        if (item) {
            items.push(item)
        }
    })
    return items
}

function parseContribution(line: string) {
    if (line.length === 0) {
        return undefined
    }
    const items = line.split(',')
    if (items.length !== 10) {
        throw Error('invalid line')
    }
    return {
        relay_account: items[0],
        account: items[1],
        total_reward: BigInt(items[3]),
        immediate_part: BigInt(items[4]),
        vested_part: BigInt(items[5]),
        per_block: BigInt(items[6]),
        start_block: BigInt(items[7]),
        end_blok: BigInt(items[8])
    }
}
