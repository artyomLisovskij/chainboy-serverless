from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
import os
from pinata import Pinata


load_dotenv()
pinata = Pinata(
    os.environ["PINATA_API_KEY"],
    os.environ["PINATA_API_SECRET"],
    os.environ["PINATA_ACCESS_TOKEN"],
)


class Task(BaseModel):
    code: str | None = None


app = FastAPI()


@app.post("/create/")
async def create_task(task: Task):
    open("/tmp/temp.py", "w").write(task.code)
    response = pinata.pin_file("/tmp/test.py")
    ipfs_hash = response["data"]["IpfsHash"]
    return {"ipfs_hash": ipfs_hash}
