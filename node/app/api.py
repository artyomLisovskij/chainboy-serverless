from fastapi import Request, FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
import os
from pinata import Pinata
from fastapi.middleware.cors import CORSMiddleware


load_dotenv()
pinata = Pinata(
    os.environ["PINATA_API_KEY"],
    os.environ["PINATA_API_SECRET"],
    os.environ["PINATA_ACCESS_TOKEN"],
)


class Task(BaseModel):
    code: str | None = None


app = FastAPI()
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

txids = []

@app.post("/create")
async def create_task(task: Task):
    open("/tmp/temp.py", "w").write(task.code)
    response = pinata.pin_file("/tmp/temp.py")
    print(response)
    ipfs_hash = response["data"]["IpfsHash"]
    return {"ipfs_hash": ipfs_hash}


@app.post("/txid")
async def post_txid(request: Request):
    result = await request.json()
    txids.append(result['hash'])
    return {"status": "ok"}
    

@app.get("/txids")
async def get_txid():
    return {"txids": txids}
