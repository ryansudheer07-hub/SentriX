from app.capture.normalizer import flatten_layers, normalize_ek_record, normalize_fields

DOTTED = {
    "frame.time.epoch": "1767268800.5",
    "ip.src": "203.0.113.7",
    "ip.dst": "198.51.100.1",
    "tcp.srcport": "44321",
    "tcp.dstport": "8333",
    "frame.len": "125",
    "bitcoin.command": "inv",
    "bitcoin.inv.type": "1",
    "bitcoin.inv.hash": "AABBCCDD",
}


def test_normalize_dotted_fields():
    ev = normalize_fields(DOTTED)
    assert ev is not None
    assert ev.peer_id == "203.0.113.7:44321"  # non-8333 side
    assert ev.message_type == "inv"
    assert ev.txid == "AABBCCDD"
    assert ev.size == 125
    assert ev.protocol == "bitcoin"


def test_normalize_ek_underscored_fields():
    ek = {
        "frame_frame_time_epoch": ["1767268800.0"],
        "ip_ip_src": ["10.0.0.9"],
        "ip_ip_dst": ["10.0.0.1"],
        "tcp_tcp_srcport": ["8333"],
        "tcp_tcp_dstport": ["55000"],
        "bitcoin_bitcoin_command": ["tx"],
    }
    ev = normalize_fields(ek)
    assert ev is not None
    assert ev.peer_id == "10.0.0.1:55000"  # peer is the non-8333 side
    assert ev.message_type == "tx"
    assert ev.event_type == "tx_seen"


def test_non_inv_command_has_no_txid():
    fields = dict(DOTTED, **{"bitcoin.command": "getdata"})
    fields.pop("bitcoin.inv.type", None)
    ev = normalize_fields(fields)
    assert ev is not None and ev.txid is None


def test_missing_timestamp_returns_none():
    assert normalize_fields({"ip.src": "1.2.3.4"}) is None


def test_missing_ip_still_normalizes():
    ev = normalize_fields({"frame.time.epoch": "1767268800.0", "bitcoin.command": "ping"})
    assert ev is not None
    assert ev.peer_id == "unknown"
    assert ev.src_ip is None


def test_large_timestamp_and_bad_types_do_not_crash():
    ev = normalize_fields(
        {"frame.time.epoch": "32503680000.0", "frame.len": "not-a-number", "tcp.srcport": None}
    )
    assert ev is not None
    assert ev.size is None
    assert ev.timestamp.year >= 3000


def test_flatten_layers_nested_and_ek():
    flat = flatten_layers({"ip": {"ip": {"src": "1.1.1.1"}}, "tcp_tcp_srcport": "1234"})
    assert flat["ip.ip.src"] == "1.1.1.1"
    assert flat["tcp.tcp.srcport"] == "1234"


def test_normalize_ek_record_and_garbage():
    rec = {"timestamp": "1767268800500", "layers": {"frame_frame_time_epoch": ["1767268800.5"],
           "bitcoin_bitcoin_command": ["inv"], "ip_ip_src": ["8.8.8.8"], "tcp_tcp_dstport": ["8333"],
           "tcp_tcp_srcport": ["40000"]}}
    ev = normalize_ek_record(rec)
    assert ev is not None and ev.message_type == "inv"
    assert normalize_ek_record({"no": "layers"}) is None
    assert normalize_ek_record({"layers": "not-a-dict"}) is None
