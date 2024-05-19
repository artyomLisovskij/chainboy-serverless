import contextlib
import json
import signal
from typing import Any, Awaitable, Dict, Union

from redis import Redis
from redis.typing import EncodableT, FieldT, KeyT, StreamIdT

ResponseT = Union[Awaitable, Any]


class RedisOverride:
    """
    redis init
    """

    def __init__(self, host, port):
        self.redis = Redis(host=host, port=port)

    def set(self, key, value):
        if type(value) is not str:
            value = json.dumps(value)
        self.redis.set(key, value)

    def get(self, key, default=None):
        value = self.redis.get(key)
        if value is None:
            return default or None
        value = value.decode("utf-8")

        with contextlib.suppress(Exception):
            value = json.loads(value)
        return value

    def sadd(self, key, value):
        return self.redis.sadd(key, value)

    def srem(self, key, value):
        return self.redis.srem(key, value)

    def smembers(self, key):
        values = list(self.redis.smembers(key))
        return [value.decode("utf-8") for value in values]

    def xread(
        self,
        streams: Dict[KeyT, StreamIdT],
        count: Union[int, None] = None,
        block: Union[int, None] = None,
    ):
        return self.redis.xread(streams, count, block)

    def xdel(self, name: KeyT, *ids: StreamIdT) -> ResponseT:
        return self.redis.xdel(name)

    def xrange(
        self,
        name: KeyT,
        min: StreamIdT = "-",
        max: StreamIdT = "+",
        count: Union[int, None] = None,
    ) -> ResponseT:
        return self.redis.xrange(
            name,
            min,
            max,
            count,
        )

    def delete(self, name: KeyT) -> ResponseT:
        return self.redis.delete(name)

    def xlen(self, name: KeyT) -> ResponseT:
        return self.redis.xlen(name)

    def xtrim(
        self,
        name: KeyT,
        maxlen: Union[int, None],
        approximate: bool = True,
        minid: Union[StreamIdT, None] = None,
        limit: Union[int, None] = None,
    ):
        return self.redis.xtrim(
            name,
            maxlen,
            approximate,
            minid,
            limit,
        )

    def xadd(
        self,
        name: KeyT,
        fields: Dict[FieldT, EncodableT],
        id: StreamIdT = "*",
        maxlen: Union[int, None] = None,
        approximate: bool = True,
        nomkstream: bool = False,
        minid: Union[StreamIdT, None] = None,
        limit: Union[int, None] = None,
    ):
        return self.redis.xadd(
            name,
            fields,
            id,
            maxlen,
            approximate,
            nomkstream,
            minid,
            limit,
        )


redis = RedisOverride("redis", 6379)


class GracefulKiller:
    kill_now = False

    def __init__(self):
        signal.signal(signal.SIGINT, self.exit_gracefully)

    def exit_gracefully(self, signum, frame):
        self.kill_now = True


killer = GracefulKiller()
