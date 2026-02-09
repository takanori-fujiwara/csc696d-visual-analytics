# Standard Library
import asyncio
import concurrent.futures
import functools
import json
import signal
import sys
from enum import IntEnum

# Third Party Library
import numpy as np
import pandas as pd
import websockets


class Message(IntEnum):
    passData = 0
    passSelectionMeans = 1
    passOverallMeans = 2

    @property
    def key(self):
        return self.name

    @property
    def label(self):
        return self.name


# Load data at startup
df = pd.read_csv("../data/wine_result.csv")
feature_names = [
    "alcohol", "malic_acid", "ash", "alcalinity_of_ash", "magnesium",
    "total_phenols", "flavanoids", "nonflavanoid_phenols", "proanthocyanins",
    "color_intensity", "hue", "od280/od315_of_diluted_wines", "proline",
]
class_names = ["class_0", "class_1", "class_2"]

X = df[feature_names].values  # (178, 13)
X_min = X.min(axis=0)
X_max = X.max(axis=0)


async def _send(executor, ws, args, func):
    event_loop = asyncio.get_running_loop()
    buf = await event_loop.run_in_executor(executor, func, args)
    await ws.send(buf)


async def _serve(executor, stop, host="0.0.0.0", port=9000):
    bound_handler = functools.partial(_handler, executor=executor)
    async with websockets.serve(bound_handler, host, port):
        await stop


async def _handler(ws, executor):
    try:
        while True:
            recv_msg = await ws.recv()
            asyncio.ensure_future(_handle_message(executor, ws, recv_msg))
    except websockets.ConnectionClosed as e:
        print(f"ConnectionClosed: {ws.remote_address}")
    except Exception as e:
        print(f"Unexpected exception {e}: {sys.exc_info()[0]}")


def _prepare_data(args):
    df_json = df.to_json(orient="records")
    return json.dumps({
        "action": int(Message.passData),
        "content": df_json,
        "featureNames": feature_names,
        "classNames": class_names,
    })


def _prepare_selection_means(args):
    indices = args["indices"]
    if len(indices) == 0:
        means = X.mean(axis=0)
        count = len(X)
    else:
        means = X[indices].mean(axis=0)
        count = len(indices)

    means_normalized = (means - X_min) / (X_max - X_min)
    return json.dumps({
        "action": int(Message.passSelectionMeans),
        "means": means_normalized.tolist(),
        "count": count,
    })


def _prepare_overall_means(args):
    means = X.mean(axis=0)
    means_normalized = (means - X_min) / (X_max - X_min)
    return json.dumps({
        "action": int(Message.passOverallMeans),
        "means": means_normalized.tolist(),
        "count": len(X),
    })


async def _handle_message(executor, ws, recv_msg):
    m = json.loads(recv_msg)
    m_action = m["action"]

    if m_action == Message.passData:
        await _send(executor, ws, m.get("content", {}), _prepare_data)
    elif m_action == Message.passSelectionMeans:
        await _send(executor, ws, m["content"], _prepare_selection_means)
    elif m_action == Message.passOverallMeans:
        await _send(executor, ws, m.get("content", {}), _prepare_overall_means)


async def start_websocket_server(host="0.0.0.0", port=9000, max_workers=4):
    executor = concurrent.futures.ThreadPoolExecutor(max_workers=max_workers)
    stop = asyncio.get_running_loop().create_future()

    if not sys.platform.startswith("win"):
        asyncio.get_running_loop().add_signal_handler(signal.SIGINT, stop.set_result, True)

    try:
        await _serve(executor, stop, host, port)
    finally:
        executor.shutdown(wait=True)


if not sys.platform.startswith("win"):
    import uvloop
    asyncio.run(
        start_websocket_server(host="0.0.0.0", port=9000, max_workers=4),
        loop_factory=uvloop.new_event_loop,
    )
else:
    asyncio.run(
        start_websocket_server(host="0.0.0.0", port=9000, max_workers=4)
    )
