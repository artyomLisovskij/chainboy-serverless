import json
import logging
import time
import traceback
import secrets
from web3 import Web3
from myglobal import killer, redis
from dotenv import load_dotenv
import os
import sys, getopt
import base58
from eth_utils import decode_hex, encode_hex
from pinata import Pinata
from web3.auto import w3
from eth_event import decode_logs, get_topic_map
import requests
import epicbox
from eth_account.messages import encode_defunct
from random import randrange


epicbox.configure(profiles=[epicbox.Profile("python", "python:3.10-slim")])

def sign_and_send_tx(w3, tx, account):
    signed_tx = w3.eth.account.sign_transaction(tx, private_key=account.key)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    return tx_hash.hex()


if __name__ == "__main__":
    node_num = 1
    try:
        opts, args = getopt.getopt(sys.argv[1:],"n:",["node="])
    except getopt.GetoptError:
        print('Error')
        sys.exit(2)

    for opt, arg in opts:
        if opt in ("-n", "--node"):
            node_num = arg

    print("Using node: ", node_num)

    load_dotenv()
    logger = logging.getLogger(__name__)
    DECIMALS = 10 ** 18
    with open("abi.json") as f:
        ABI = json.load(f)
    with open("abi_erc20.json") as f:
        ABI_ERC20 = json.load(f)
    w3 = Web3(Web3.HTTPProvider(os.environ["RPC_URL"]))
    contract = w3.eth.contract(address=os.environ["CONTRACT_ADDRESS"], abi=ABI)
    contract_token = w3.eth.contract(address=os.environ["TOKEN_ADDRESS"], abi=ABI_ERC20)
    account = w3.eth.account.from_key(os.environ["NODE_" + str(node_num) + "_PK"])
    topic_map = get_topic_map(ABI)
    print('Node started')

    our_requests = {}
    requests_to_check = {}
    known_txids = requests.get("https://chainboy.alfaline.dev/api/txids").json()['txids']
    while not killer.kill_now:
        try:
            time.sleep(randrange(5))
            txids = requests.get("https://chainboy.alfaline.dev/api/txids").json()['txids']
            for txid in txids:
                if txid not in known_txids:
                    
                    print(f'Processing tx {txid}')
                    my_tx = w3.eth.wait_for_transaction_receipt(bytes.fromhex(txid[2:]))
                    for event in decode_logs(my_tx["logs"], topic_map, True):
                        print(f'Event {event["name"]}')
                        if event["name"] == "NewRequest":
                            print(f'Our event {event["name"]}')
                            request_id = event["data"][0]["value"]
                            ipfs_hash = event["data"][1]["value"]
                            variable = event["data"][2]["value"]
                            if request_id not in our_requests.keys():
                                our_requests[request_id] = {}
                                our_requests[request_id]['ipfs_hash'] = ipfs_hash
                                our_requests[request_id]['variable'] = variable
                                our_requests[request_id]['solutions'] = {}
                            print([request_id, ipfs_hash, variable])
                            code_request = requests.get("https://gateway.pinata.cloud/ipfs/" + ipfs_hash)
                            if code_request.status_code != 200:
                                raise Exception("Wrong IPFS response")
                            source_code = code_request.text
                            code = 'INPUT = "' + str(variable) + '"' + "\n" + source_code
                            print(code)
                            print(variable)
                            files = [
                                {
                                    "name": "main.py", 
                                    "content": code.encode("UTF-8")
                                }
                            ]
                            limits = {"cputime": 3, "memory": 64}
                            result = epicbox.run(
                                "python", "python3 main.py", files=files, limits=limits
                            )
                            str_result = result["stdout"].decode("utf-8").replace("\n", "")
                            our_requests[request_id]['solutions'][account.address] = str_result
                            nonce = w3.eth.get_transaction_count(account.address, "pending")
                            message_hash = Web3.solidity_keccak(["bytes32","string"], [request_id, str_result])
                            sign = w3.eth.account.sign_message(encode_defunct(message_hash), private_key=account.key).signature.hex()
                            tx = contract.functions.newSolution(
                                request_id, 
                                str_result,
                                sign
                            ).build_transaction(
                                {
                                    "from": account.address,
                                    "chainId": w3.eth.chain_id,
                                    "gas": 1000000,
                                    "gasPrice": w3.eth.gas_price,
                                    "nonce": nonce,
                                }
                            )
                            tx_hash = sign_and_send_tx(w3, tx, account)
                            receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
                            print(request_id + ' solution made:')
                            print(str_result)
                            print(tx_hash)
                            known_txids.append(txid)
                        if event["name"] == "NewConsensus":
                            known_txids.append(txid)
                            request_id = event["data"][0]["value"]
                            if request_id in requests_to_check.copy().keys():
                                del requests_to_check[request_id]
                            print(f'Already consensus')
                        if event["name"] == "NewSolution":
                            known_txids.append(txid)
                            print(f'Our event {event["name"]}')
                            request_id = event["data"][0]["value"]
                            signer = event["data"][1]["value"]
                            solution = event["data"][2]["value"]
                            # check consensus first
                            if request_id not in our_requests.keys():
                                our_requests[request_id] = {}
                                our_requests[request_id]['ipfs_hash'] = ipfs_hash
                                our_requests[request_id]['variable'] = variable
                                our_requests[request_id]['solutions'] = {}
                            our_requests[request_id]['solutions'][Web3.to_checksum_address(signer)] = solution
                            total_supply = contract_token.functions.totalSupply().call() // DECIMALS
                            solutions_weights = {}
                            for key, value in our_requests[request_id]['solutions'].items():
                                if value not in solutions_weights.keys():
                                    solutions_weights[value] = 0
                                solutions_weights[value] += contract_token.functions.balanceOf(key).call() // DECIMALS
                            result_solution = max(solutions_weights, key=solutions_weights.get)
                            print("Consensus got: " + str(max(solutions_weights.values())))
                            print("Total: " + str(total_supply))
                            if max(solutions_weights.values()) / total_supply > 0.5:
                                try:
                                    result = contract.functions.getResult(request_id).call()
                                except:
                                    result = ""
                                if result != "":
                                    if request_id in requests_to_check.keys():
                                        del requests_to_check[request_id]
                                    print('already consensus')
                                else:
                                    nonce = w3.eth.get_transaction_count(account.address, "pending")
                                    message_hash = Web3.solidity_keccak(["bytes32","string"], [request_id, result_solution])
                                    sign = w3.eth.account.sign_message(encode_defunct(message_hash), private_key=account.key).signature.hex()
                                    print("Trying to finalize")
                                    tx = contract.functions.checkConsensus(
                                        request_id, 
                                        result_solution,
                                        sign
                                    ).build_transaction(
                                        {
                                            "from": account.address,
                                            "chainId": w3.eth.chain_id,
                                            "gas": 1000000,
                                            "gasPrice": w3.eth.gas_price,
                                            "nonce": nonce,
                                        }
                                    )
                                    tx_hash = sign_and_send_tx(w3, tx, account)
                                    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
                                    print(request_id + ' was solved and confirmed')
                                    print(tx_hash)
                            else:
                                requests_to_check[request_id] = int(time.time()) + randrange(10)
            for request_id in requests_to_check.copy().keys():
                if int(time.time()) > requests_to_check[request_id]:
                    # try to recheck consensus
                    total_supply = contract_token.functions.totalSupply().call() // DECIMALS
                    solutions_weights = {}
                    for key, value in our_requests[request_id]['solutions'].items():
                        if value not in solutions_weights.keys():
                            solutions_weights[value] = 0
                        solutions_weights[value] += contract_token.functions.balanceOf(key).call() // DECIMALS
                    result_solution = max(solutions_weights, key=solutions_weights.get)
                    print("Consensus got: " + str(max(solutions_weights.values())))
                    print("Total: " + str(total_supply))
                    if max(solutions_weights.values()) / total_supply > 0.5:
                        try:
                            result = contract.functions.getResult(request_id).call()
                        except:
                            result = ""
                        if result != "":
                            if request_id in requests_to_check.keys():
                                del requests_to_check[request_id]
                            print('already consensus')
                        else:
                            nonce = w3.eth.get_transaction_count(account.address, "pending")
                            message_hash = Web3.solidity_keccak(["bytes32","string"], [request_id, result_solution])
                            sign = w3.eth.account.sign_message(encode_defunct(message_hash), private_key=account.key).signature.hex()
                            print("Trying to finalize")
                            tx = contract.functions.checkConsensus(
                                request_id, 
                                result_solution,
                                sign
                            ).build_transaction(
                                {
                                    "from": account.address,
                                    "chainId": w3.eth.chain_id,
                                    "gas": 1000000,
                                    "gasPrice": w3.eth.gas_price,
                                    "nonce": nonce,
                                }
                            )
                            tx_hash = sign_and_send_tx(w3, tx, account)
                            receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
                            print(request_id + ' was solved and confirmed')
                            print(tx_hash)
                            if request_id in requests_to_check.keys():
                                del requests_to_check[request_id]
                    else:
                        requests_to_check[request_id] = int(time.time()) + randrange(10)
        except Exception as e:
            logger.error(
                f"[ERROR] {e}"
            )
            print(traceback.format_exc())
            continue
        time.sleep(1)