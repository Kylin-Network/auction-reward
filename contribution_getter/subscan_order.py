import json
import requests
import argparse
import math
import decimal


def subscan_getter(total_contributors, fid, _url):
    pages = math.ceil(total_contributors/100)
    print(pages)
    headers = {'Content-Type': 'application/json',
               'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:22.0) Gecko/20100101 Firefox/22.0'}
    contributes = []
    cur_len = 0
    for page in range(pages):
        print(page)
        datas = json.dumps({"page": page, "row": 100, "fund_id": fid})
        r = requests.post(url=_url, data=datas, headers=headers)
        contributes.extend(json.loads(r.text)["data"]["contributes"])
        print(cur_len + len(contributes))
        # time.sleep(1)
    store_tojsonfile('subscan_response.json', contributes)


def load_jsonfile(filename):
    with open(filename) as f:
        data = json.load(f)
        return data


def store_tojsonfile(filename, data):
    with open(filename, 'w') as fw:
        json.dump(data, fw)


def compare(elem):
    return elem["block_timestamp"]


if __name__ == '__main__':

    decimal.getcontext().prec = 50
    parser = argparse.ArgumentParser()
    parser.add_argument('--crowdloan_id', '-cid', type=str, required=True)
    parser.add_argument('--subscan_api', '-sapi', type=str, required=True)
    parser.add_argument('--inputfile', '-i', type=str, required=True)
    parser.add_argument('--total_general_fund', '-tgf',
                        type=str, required=True)

    args = parser.parse_args()
    total_general_fund = args.total_general_fund
    data_from_polkadot = load_jsonfile(args.inputfile)
    data_with_memo_no_blocktime = data_from_polkadot["contributions"]
    total_contributors = len(data_with_memo_no_blocktime)
    total_raised = data_from_polkadot["total_raised"]
    paraid = data_from_polkadot["parachain_id"]
    print(total_contributors, total_raised, total_general_fund)

    # subscan_getter(total_contributors,args.crowdloan_id,args.subscan_api)
    data_with_time_no_memo = load_jsonfile('subscan_response.json')

    accout2index = {}
    for (index, obj) in enumerate(data_with_memo_no_blocktime):
        key = list(obj.values())[0]
        accout2index[key] = index
        # print(key, index)

    for item in data_with_time_no_memo:
        key = item["who"]
        extrinsicindex = item["extrinsic_index"].replace('-', '')
        blocktimestamp = item["block_timestamp"]
        index = accout2index[key]
        data_with_memo_no_blocktime[index]["extrinsic_index"] = extrinsicindex
        data_with_memo_no_blocktime[index]["block_timestamp"] = blocktimestamp

    sorted_data = sorted(data_with_memo_no_blocktime, key=lambda x: (
        x["block_timestamp"], x["extrinsic_index"]))

    # now calculate reward
    money_counter = 0
    general_distributed = 0
    money_distributed = decimal.Decimal(0)
    for item in sorted_data:
        general = decimal.Decimal(
            item["contribution"])*decimal.Decimal(total_general_fund)/decimal.Decimal(total_raised)
        money_counter += int(item["contribution"])
        reward = general.quantize(decimal.Decimal('0'))
        real_reward = (reward - reward % decimal.Decimal(10**16) +
                       decimal.Decimal(10 ** 16)).quantize(decimal.Decimal('0'))
        diff_reward = (reward - real_reward)
        item["reward"] = str(reward)
        item["reward_symbol"] = str(
            reward / decimal.Decimal(10**18) + reward % decimal.Decimal(10**18))
        item["real_reward"] = str(real_reward)
        item["diff_reward"] = str(diff_reward)
        money_distributed = money_distributed + real_reward
        print(total_general_fund, total_raised,
              item["reward"], item["real_reward"], item["diff_reward"])

    print("distributed money", money_distributed)
    if (int(total_general_fund)) - money_distributed > len(sorted_data):
        print("The dust is bigger than total contributor")

    # build json structur and save to file
    result = {"total_raised": total_raised,
              "contributions": sorted_data, "parachain_id": paraid}
    store_tojsonfile('fianllist.json', result)
