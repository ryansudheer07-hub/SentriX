# SentriX Backend API & Live Loop

Backend module for **SIH26146 — AI-Powered Monitoring & Analysis of Bitcoin
Transaction Traffic** (Team ZENITH). Covers Technical Architecture §3.7
(Live Monitoring & Rescoring Loop) and §3.9 (Backend API): REST endpoints,
JWT auth with role-based access control, audit logging, and the periodic
rescoring scheduler.

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
copy .env.example .env
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

Interactive API docs: http://127.0.0.1:8000/docs

## Demo users

| username | password | role | agency |
|---|---|---|---|
| admin | admin123 | admin | NTRO |
| investigator1 | investigate123 | investigator | NTRO |
| analyst1 | analyst123 | analyst | FIU-IND |

(See `app/db/users_store.py` — swap for a real user table post-hackathon.)

## Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/health` | none | liveness check |
| POST | `/auth/login` | none | form body: `username`, `password` → JWT |
| GET | `/auth/me` | any role | current user's identity |
| GET | `/address/{id}/risk` | admin/investigator/analyst | fused risk score + contributing factors |
| GET | `/alerts?threshold=&limit=` | admin/investigator/analyst | addresses above a risk threshold |
| GET | `/graph/{id}?depth=` | admin/investigator/analyst | subgraph around an address |
| GET | `/traffic/status` | admin/investigator/analyst | capture mode + window stats |
| GET | `/traffic/anomalies?min_score=&limit=` | admin/investigator/analyst | ranked traffic anomalies |
| GET | `/traffic/{id}/correlation` | admin/investigator/analyst | explainable anomaly result (transaction or peer) |
| GET | `/traffic/{txid}/propagation` | admin/investigator/analyst | per-peer broadcast timeline (frontend viz) |
| GET | `/audit/logs?limit=` | admin only | who queried what, and when |

Every request (successful or not) is logged to `audit.log` as JSON lines:
timestamp, resolved user (or `anonymous`), method, path, status code.

## Live rescoring loop

`app/scheduler/rescoring.py` runs an APScheduler background job every
`RESCORE_INTERVAL_MINUTES` (default 5) that recomputes risk scores for
addresses touched by recent activity — not the whole graph, matching the
incremental-PPR-plus-GNN-inference design in Technical Architecture §3.7.
It logs a `rescoring_cycle` system event into the same audit log each run.

APScheduler is used in place of the architecture doc's "Celery beat / cron"
line item — same periodic-rescoring role, no Redis/worker infra needed for
a hackathon demo. Swapping to Celery beat later doesn't require touching
`risk_service.py` or any router.

## Integration points for the rest of the team

This module currently runs entirely on **mock data** so it's demoable
standalone. Two files are the integration seam:

- **`app/db/neo4j_client.py`** — wraps the Neo4j driver. Fill in `.env`
  (`NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`) once the graph store
  (§3.3) is up; `run_query()` then hits the real database instead of
  raising "mock mode."
- **`app/services/risk_service.py`** — every function here (`get_address_risk`,
  `list_alerts`, `get_subgraph`, `rescore_neighborhood`) currently returns
  deterministic pseudo-random data. Replace each function body with the
  real call into the Graph Analysis Engine / Traffic Correlation Engine /
  Fusion Engine (§3.4–3.6), keeping the same signatures — no router or
  test needs to change.

## Traffic Correlation Engine (§3.5)

```
tshark / PCAP ─> TrafficCapture ─> TrafficEvent ─> TrafficCorrelationEngine
   ─> CorrelationResult (features + factors) ─> Fusion / Risk Service ─> REST / alerts
```

Bitcoin P2P traffic is captured, normalized to `TrafficEvent`s, held in a
bounded in-memory window (`TRAFFIC_WINDOW_SECONDS`, `TRAFFIC_MAX_EVENTS`), and
correlated per transaction / per peer into four heuristic, explainable,
deterministic features in `[0, 1]`:

| feature | what it measures |
|---|---|
| `broadcast_timing` | how compressed the propagation is across peers (many peers seeing a tx within `TRAFFIC_NEAR_SIMULTANEOUS_MS`) plus a lopsided-tail term |
| `burst_activity` | this tx's event volume vs. the median *other* tx in the window, and the overall window rate vs. `TRAFFIC_BURST_BASELINE_RATE` scaled by the tx's share |
| `peer_concentration` | low peer entropy / one dominant peer (`0.45·(1−normEntropy) + 0.55·dominantShare`) |
| `propagation_irregularity` | duplicate announcements, uneven inter-arrival gaps (coefficient of variation), fan-out above `TRAFFIC_EXPECTED_FANOUT`, compression |

`anomaly_score = Σ weightᵢ·featureᵢ / Σ weightᵢ` with configurable
`TRAFFIC_WEIGHT_*`. Each response carries `factors` — name, score, weight,
contribution and a plain-language `explanation` — so the score is auditable.
**Heuristic traffic anomalies are signals, not proof of malicious activity.**

### Modes

- **Demo (default)** — `TRAFFIC_CAPTURE_ENABLED=false`, no `PCAP_REPLAY_PATH`.
  The engine seeds deterministic fixtures (`tx-normal-001`, `tx-burst-001`,
  `tx-concentration-001`, `tx-irregular-001`, `tx-suspicious-001` — all clearly
  marked demo data). `/traffic/*` works with zero setup.
- **PCAP replay** — `PCAP_REPLAY_PATH=/path/to/capture.pcap` (parsed via
  `tshark -r`) or `.jsonl` of `TrafficEvent` lines. Falls back to demo fixtures
  if tshark is missing or the capture has no dissectable Bitcoin traffic.
- **Live tshark** — `TRAFFIC_CAPTURE_ENABLED=true` + `TSHARK_INTERFACE=eth0`.
  Runs `tshark -i <iface> -f "<filter>" -T ek -l` on a daemon thread (no
  `shell=True`, fixed argv). A missing tshark logs a clear error and the app
  still starts in demo mode.

### Fusion & scheduler integration

- `risk_service._compute_address_risk()` now pulls its `traffic` component from
  `traffic_correlation.get_address_traffic_anomaly(address)`; if the engine has
  no data it keeps the previous deterministic fallback, so existing behaviour
  and tests are unchanged. *(Bitcoin traffic carries txids/peer IPs, not
  addresses — the address↔tx association is the graph/ingestion layer's job;
  until that index exists the adapter maps each address deterministically to one
  correlated transaction's profile.)*
- `rescoring.run_rescoring_cycle()` calls `traffic_correlation.refresh()` first
  (recompute the anomaly snapshot; a no-op on an empty window) and logs a
  `traffic_refresh` system event.

### Demo commands

```bash
uvicorn app.main:app --reload --port 8000          # demo mode
PCAP_REPLAY_PATH=./sample.pcap uvicorn app.main:app --port 8000   # replay a capture
TRAFFIC_CAPTURE_ENABLED=true TSHARK_INTERFACE=eth0 uvicorn app.main:app --port 8000   # live
```

On Windows set env vars with `set VAR=value` (cmd) or `$env:VAR="value"`
(PowerShell) before `uvicorn`.

### Limitations

tshark must be installed for live/PCAP parsing; Bitcoin P2P visibility is
limited to what the Wireshark `bitcoin` dissector exposes (message type always,
txid only from `inv` announcements, nothing for encrypted BIP-324 v2
transport); the demo fixtures are synthetic; anomaly detection is heuristic.

## Tests

```bash
pytest
```

Traffic suite: `test_traffic_models`, `test_broadcast_timing`,
`test_burst_detection`, `test_peer_concentration`,
`test_propagation_irregularity`, `test_anomaly_scoring`, `test_tshark_parser`,
`test_pcap_replay`, `test_traffic_api`, `test_traffic_rbac`,
`test_fusion_integration` — covering empty/single/duplicate input, malformed
packets, huge timestamps, window/memory bounds, score `∈ [0,1]`, determinism,
auth, RBAC, audit logging and scheduler compatibility.
