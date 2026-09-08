"""
Turn one tshark/PCAP record into a `TrafficEvent`, using only fields that are
actually present. tshark's Bitcoin visibility is limited: message *type* is
usually available (`bitcoin.command`), a txid only for `inv` announcements
(`bitcoin.inv.hash` with type MSG_TX), and nothing at all for encrypted
BIP-324 v2 transport. Missing fields are left `None` — the event is still
useful for burst and peer analysis.

`normalize_ek_record()` handles tshark's `-T ek` (newline-JSON) shape;
`normalize_fields()` takes an already-flat mapping and is what the tests use.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from app.models.traffic import TrafficEvent

logger = logging.getLogger("traffic.normalizer")

_BITCOIN_PORT = 8333

_EVENT_TYPE_BY_COMMAND = {
    "inv": "inv",
    "tx": "tx_seen",
    "block": "block",
    "getdata": "getdata",
    "notfound": "notfound",
    "headers": "headers",
    "addr": "addr",
}

# bitcoin.inv.type values (Wireshark): 1 = MSG_TX, 2 = MSG_BLOCK.
_INV_TYPE_TX = "1"


def _first(value: Any) -> Any:
    """tshark `-T ek` wraps most values in a single-element list."""
    if isinstance(value, list):
        return value[0] if value else None
    return value


def _get(fields: dict[str, Any], *keys: str) -> Any:
    for key in keys:
        if key in fields and fields[key] not in (None, ""):
            return _first(fields[key])
    return None


def _to_int(value: Any) -> int | None:
    try:
        return int(str(value), 0) if isinstance(value, str) and value.lower().startswith("0x") else int(value)
    except (TypeError, ValueError):
        return None


def _to_float(value: Any) -> float | None:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def flatten_layers(layers: dict[str, Any]) -> dict[str, Any]:
    """Flatten a nested tshark `layers` dict to dotted keys (`ip.ip.src` -> value)."""
    flat: dict[str, Any] = {}

    def _walk(node: Any, prefix: str) -> None:
        if isinstance(node, dict):
            for key, val in node.items():
                _walk(val, f"{prefix}.{key}" if prefix else key)
        else:
            flat[prefix] = node

    _walk(layers, "")
    # `-T ek` already flattens with underscores; expose those as dotted too.
    for key, val in list(flat.items()):
        if "_" in key and "." not in key:
            flat[key.replace("_", ".")] = val
    return flat


def normalize_fields(fields: dict[str, Any]) -> TrafficEvent | None:
    """
    Build a `TrafficEvent` from a flat field mapping. Keys may be dotted
    (`ip.src`, `bitcoin.command`) or tshark-EK underscored
    (`ip_ip_src`, `bitcoin_bitcoin_command`). Returns None if there is not
    even a usable timestamp.
    """
    epoch = _to_float(
        _get(fields, "frame.time.epoch", "frame_frame_time_epoch", "timestamp", "frame.time_epoch")
    )
    ts_raw = _get(fields, "frame.time", "timestamp_iso")
    if epoch is not None:
        timestamp = datetime.fromtimestamp(epoch, tz=timezone.utc)
    elif isinstance(ts_raw, str):
        try:
            timestamp = datetime.fromisoformat(ts_raw.replace("Z", "+00:00"))
        except ValueError:
            return None
    else:
        return None

    src_ip = _get(fields, "ip.src", "ip.ip.src", "ip_ip_src", "ipv6.src")
    dst_ip = _get(fields, "ip.dst", "ip.ip.dst", "ip_ip_dst", "ipv6.dst")
    src_port = _to_int(_get(fields, "tcp.srcport", "tcp.tcp.srcport", "tcp_tcp_srcport"))
    dst_port = _to_int(_get(fields, "tcp.dstport", "tcp.tcp.dstport", "tcp_tcp_dstport"))
    size = _to_int(_get(fields, "frame.len", "frame.frame.len", "frame_frame_len", "tcp.len"))

    command = _get(fields, "bitcoin.command", "bitcoin.bitcoin.command", "bitcoin_bitcoin_command")
    message_type = str(command).strip().lower() if command is not None else None

    txid = None
    inv_type = _get(fields, "bitcoin.inv.type", "bitcoin_bitcoin_inv_type")
    inv_hash = _get(fields, "bitcoin.inv.hash", "bitcoin_bitcoin_inv_hash")
    tx_hash = _get(fields, "bitcoin.tx.txid", "bitcoin_bitcoin_tx_txid")
    if tx_hash:
        txid = str(tx_hash)
    elif inv_hash and (inv_type is None or str(inv_type) == _INV_TYPE_TX) and message_type == "inv":
        txid = str(inv_hash)
    if txid:
        txid = "".join(c for c in txid if c.isalnum())[:128] or None

    # The peer is whichever side isn't the local Bitcoin listener.
    if dst_port == _BITCOIN_PORT and src_ip:
        peer_ip, peer_port = src_ip, src_port
    elif src_port == _BITCOIN_PORT and dst_ip:
        peer_ip, peer_port = dst_ip, dst_port
    else:
        peer_ip, peer_port = src_ip, src_port
    peer_id = f"{peer_ip}:{peer_port}" if peer_ip and peer_port else (peer_ip or "unknown")

    protocol = "bitcoin" if message_type else ("tcp" if src_port or dst_port else "ip")
    event_type = _EVENT_TYPE_BY_COMMAND.get(message_type or "", "packet")

    try:
        return TrafficEvent(
            timestamp=timestamp,
            peer_id=peer_id,
            src_ip=src_ip,
            dst_ip=dst_ip,
            src_port=src_port,
            dst_port=dst_port,
            event_type=event_type,
            txid=txid,
            size=size,
            protocol=protocol,
            message_type=message_type,
            raw_metadata={"source": "tshark"},
        )
    except ValueError as exc:  # e.g. an id that fails validation
        logger.debug("dropping unnormalizable packet: %s", exc)
        return None


def normalize_ek_record(record: dict[str, Any]) -> TrafficEvent | None:
    """Normalize one tshark `-T ek` data line (`{"timestamp": ..., "layers": {...}}`)."""
    layers = record.get("layers")
    if not isinstance(layers, dict):
        return None
    fields = flatten_layers(layers)
    if "timestamp" not in fields and "timestamp" in record:
        # EK puts frame epoch (ms) at the top level.
        epoch_ms = _to_float(record["timestamp"])
        if epoch_ms is not None:
            fields["frame.time.epoch"] = epoch_ms / 1000.0
    return normalize_fields(fields)
