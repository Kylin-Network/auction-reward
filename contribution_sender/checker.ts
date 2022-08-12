import yargs from 'yargs';
import type { Balance } from '@polkadot/types/interfaces';
import * as fs from 'fs'
import { Decimal } from 'decimal.js';
import { loadContributions } from './util';

const args = yargs.options({
    'input-csv': { type: 'string', demandOption: true, alias: 'i' },
    'batch-size': { type: 'number', demandOption: false, alias: 'b' },
}).argv;



async function main() {
    const chunk = (args['batch-size']);
    console.log("chunk is %s", chunk);

    let contributions = loadContributions(args['input-csv']);

    // In here we just batch the calls.
    let total_length = 0;
    let total_tge_reward = BigInt(0);
    let total_vested_reward = BigInt(0);
    let i, j, temporary;
    console.log("-------------------");
    // skip the header
    for (i = 0, j = contributions.length; i < j; i += chunk) {
        temporary = contributions.slice(i, i + chunk);
        const batchTxs = [];
        for (var k = 0; k < temporary.length; k++) {
            //console.log("account contribution is %s, reward is %s",temporary[k]["contribution"],temporary[k]["reward"]);
            let start_block = temporary[k]["start_block"];
            let vested_part = temporary[k]['vested_part'];
            let immediate_part = temporary[k]["immediate_part"];
            let per_block = temporary[k]["per_block"];
            let schedule = { locked: vested_part as unknown as Balance, perBlock: per_block as unknown as Balance, startingBlock: start_block }
            console.log('every block release %s, vested part is %s, immediate part is %s', per_block, vested_part, immediate_part);
            console.log("schedule is %s", schedule);
            console.log("chunk %s account %s ", (i + chunk) / chunk, k);

            total_tge_reward += BigInt(immediate_part);
            total_vested_reward += BigInt(vested_part);
            total_length += 1;
        }
    }
    console.log("%s has all distributed", total_length);
    console.log("total_tge_reward %s", total_tge_reward);
    console.log("total_vested_reward %s", total_vested_reward);
    let total_reward = total_tge_reward + total_vested_reward;
    console.log("total_reward %s", total_reward);
    console.log(new Decimal(`${total_reward}`).div(10**18).toFixed(2));
    console.log('xxx')
}

main().catch(console.error).finally(() => process.exit());
