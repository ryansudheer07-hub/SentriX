"""Shared fixtures/helpers for the traffic-correlation test suite."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest

from app.models.traffic import TrafficEvent
from app.services import traffic_correlation

ANCHOR = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)


def make_event(
    *,
    offset_ms: float = 0.0,
    peer_id: str = "peer-01",
    txid: str | None = "tx-test",
    message_type: str | None = "inv",
    src_ip: str = "203.0.113.5",
    dst_ip: str = "198.51.100.1",
    size: int = 61,
) -> TrafficEvent:
    """A TrafficEvent `offset_ms` after ANCHOR (deterministic, no wall clock)."""
    return TrafficEvent(
        timestamp=ANCHOR + timedelta(milliseconds=offset_ms),
        peer_id=peer_id,
        src_ip=src_ip,
        dst_ip=dst_ip,
        src_port=45000,
        dst_port=8333,
        event_type="inv" if message_type == "inv" else "packet",
        txid=txid,
        size=size,
        protocol="bitcoin",
        message_type=message_type,
        raw_metadata={"source": "test"},
    )


@pytest.fixture
def engine() -> traffic_correlation.TrafficCorrelationEngine:
    """A fresh, isolated engine (window big enough that ANCHOR events survive)."""
    return traffic_correlation.TrafficCorrelationEngine(window_seconds=3600, max_events=10_000)


@pytest.fixture(autouse=True)
def _reset_module_engine(monkeypatch):
    """Keep shared module singletons clean between tests, and force the AI layer
    onto the deterministic mock provider so the suite never touches a real LLM
    regardless of a developer's local backend/.env."""
    from app.ai import service as ai_service
    from app.core.config import settings

    monkeypatch.setattr(settings, "ai_provider", "mock")
    monkeypatch.setattr(settings, "ai_api_key", "")

    traffic_correlation.engine.clear()
    traffic_correlation._seeded = False
    ai_service._store._data.clear()
    yield
    traffic_correlation.engine.clear()
    traffic_correlation._seeded = False
    ai_service._store._data.clear()
