from dotenv import load_dotenv
import os
from pinata import Pinata
from web3 import Web3
import json


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
account = w3.eth.account.from_key(os.environ["PRIVATE_KEY"])
nonce = w3.eth.get_transaction_count(account.address, "pending")

pinata = Pinata(
    os.environ["PINATA_API_KEY"],
    os.environ["PINATA_API_SECRET"],
    os.environ["PINATA_ACCESS_TOKEN"],
)

# def post(self, request):
# input_file = request.FILES["input_file"]
response = pinata.pin_file("demo/to_ipfs.py")
ipfs_hash = response["data"]["IpfsHash"]
print(ipfs_hash)

tx = contract.functions.add_task(ipfs_hash).build_transaction(
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
# os.environ['IPN_API_KEY']
