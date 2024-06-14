import json
import logging
import time
import traceback
import secrets
# from web3 import Web3
from myglobal import killer, redis

logger = logging.getLogger(__name__)
# with open("abi.json") as f:
#     ABI = json.load(f)
# config = redis.get("network_config")
# w3 = Web3(Web3.HTTPProvider(config[network]))
# contract = w3.eth.contract(address=redis.get("contract_address"), abi=ABI)
# rng_contract = w3.eth.contract(address=redis.get("contract_rng_address"), abi=RNG_ABI)
# account = w3.eth.account.from_key(redis.get("pk"))
print('start')
while not killer.kill_now:
    try:
        time.sleep(1)
    except Exception as e:
        logger.error(
            f"[ERROR] {e}"
        )
        print(traceback.format_exc())
        continue
    time.sleep(1)