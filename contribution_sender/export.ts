import yargs from 'yargs';
import loadJsonFile from 'load-json-file';
import { Decimal } from 'decimal.js';

const args = yargs.options({
    'input-dir': { type: 'string', demandOption: true, alias: 'i' },
}).argv;

async function main() {
    let contributors = await loadJsonFile(args['input-dir']);
    let contributions = contributors["contributions"];
    let adjust_block = 70 * 24 * 60 * 60 / 12
    let start_block = 1;
    let end_block = start_block + (48 * 7 * 24 * 60 * 60 / 12)

    let length = end_block - start_block;
    let header = 'Relay Account,Pichiu Account,Contribution(KSM),Total Reward(PCHU),TGE Reward(PCHU),Vesting Lock(PCHU),Unlock Per Block(PCHU),Relaychain Start Blocknum,Relaychain End Blocknum,Blocknum length'
    console.log(header)
    // In here we just batch the calls.
    for (let i = 0; i < contributions.length; i++) {
        let contribution = contributions[i];
        let amount = contribution["contribution"]
        let reward = contribution["real_reward"]
        let relay_account = contribution["account"];
        let para_account = contribution["para_account"];
        let vested_part = BigInt(reward) * BigInt(7) / BigInt(10);
        let per_block = vested_part / BigInt(length);
        let immediate_part = BigInt(reward) - vested_part;

        // plus 38day + 32 reward(4.10 -> 5.19 -> 6.20)
        let adjust_reward = BigInt(adjust_block) * per_block
        immediate_part = immediate_part + adjust_reward
        vested_part = vested_part - adjust_reward
        let blockinfo = `${start_block},${end_block - adjust_block},${length - adjust_block}`
        // let line = `${relay_account},${para_account},${amount},${reward},${immediate_part},${vested_part},${per_block},${blockinfo}`;
        let line = `${relay_account},${para_account},${new Decimal(amount).div(10**12).toFixed(2)},${new Decimal(reward).div(10**18).toFixed(2)},${new Decimal(immediate_part.toString()).div(10**18).toFixed(2)},${new Decimal(vested_part.toString()).div(10**18).toFixed(2)},${new Decimal(per_block.toString()).div(10**18).toFixed(6)},${blockinfo}`;
        console.log(line)
    }
}

main().catch(console.error).finally(() => process.exit());
