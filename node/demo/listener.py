from dotenv import load_dotenv
import os
import base58
from eth_utils import decode_hex, encode_hex
from pinata import Pinata
from web3 import Web3
from web3.auto import w3
import json
import websocket
from eth_event import decode_logs, get_topic_map
import requests
import epicbox


epicbox.configure(profiles=[epicbox.Profile("python", "python:3.6.5-alpine")])


def sign_and_send_tx(w3, tx, account):
    signed_tx = w3.eth.account.sign_transaction(tx, private_key=account.key)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    return tx_hash.hex()


load_dotenv()

with open("demo/abi.json") as f:
    ABI = json.load(f)

w3 = Web3(Web3.HTTPProvider("https://rpc.test.siberium.net"))
contract = w3.eth.contract(
    address="0xCAEA2C21165653d48c9Fd54E5523917f1a8184E3", abi=ABI
)
topic_map = get_topic_map(ABI)
account = w3.eth.account.from_key(os.environ["PRIVATE_KEY"])

ws = websocket.create_connection(
    "wss://ipn.tools/websocket/messages",
    header={"Authorization": os.environ["IPN_API_KEY"]},
)

ws.send(
    json.dumps(
        {
            "command": "filter",
            "events": [84],
        }
    )
)
message = ws.recv()
print(message)

while True:
    result = ws.recv()
    event = json.loads(result)
    my_tx = w3.eth.wait_for_transaction_receipt(bytes.fromhex(event["hash"][2:]))
    # my_tx = w3.eth.wait_for_transaction_receipt(
    #     bytes.fromhex("30689730d01872592ca9c9c5977882361e43e4c3c8d9637a14160dc33f62ebc2")
    # )
    for event in decode_logs(my_tx["logs"], topic_map, True):
        if event["name"] == "NewTask":
            ipfs_hash = event["data"][0]["value"]
            code = requests.get("https://gateway.pinata.cloud/ipfs/" + ipfs_hash).text
            files = [{"name": "main.py", "content": code.encode("UTF-8")}]
            limits = {"cputime": 1, "memory": 64}
            result = epicbox.run(
                "python", "python3 main.py", files=files, limits=limits
            )
            str_result = result["stdout"].decode("utf-8").replace("\n", "")
            nonce = w3.eth.get_transaction_count(account.address, "pending")
            tx = contract.functions.complete_task(
                ipfs_hash, str_result
            ).build_transaction(
                {
                    "from": account.address,
                    "chainId": w3.eth.chain_id,
                    "gas": 100000,
                    "gasPrice": w3.eth.gas_price,
                    "nonce": nonce,
                }
            )
            tx_hash = sign_and_send_tx(w3, tx, account)
            receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
            print(tx_hash)
