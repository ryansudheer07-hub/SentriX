"use client"

import {
  RISK_LEVEL_LABEL,
  RISK_LEVEL_PILL,
  riskLevel,
  type AddressDetail,
  type AddressFlow,
} from "@/lib/graphTypes"

export type AddressDetailsStatus = "idle" | "loading" | "loaded" | "error"

type AddressDetailsProps = {
  status: AddressDetailsStatus
  detail: AddressDetail | null
  error: string | null
  onRetry: () => void
  onSelectAddress: (id: string) => void
  onClose: () => void
}

const alertTone: Record<string, string> = {
  CRITICAL: "danger",
  HIGH: "warn",
  MEDIUM: "muted",
}

const statusTone: Record<string, string> = {
  FLAGGED: "danger",
  REVIEW: "warn",
  CLEARED: "ok",
}

const fmtBtc = (n: number) => `${n.toFixed(3)} BTC`

function FlowList({
  rows,
  emptyLabel,
  onSelectAddress,
}: {
  rows: AddressFlow[]
  emptyLabel: string
  onSelectAddress: (id: string) => void
}) {
  if (rows.length === 0) {
    return <p className="addr-details__empty">{emptyLabel}</p>
  }
  return (
    <ul className="addr-details__flows">
      {rows.map((row) => (
        <li key={row.address} className="addr-details__flow">
          <button
            type="button"
            className="addr-details__addr-link"
            onClick={() => onSelectAddress(row.address)}
          >
            {row.label}
          </button>
          <span className="addr-details__flow-meta">
            {fmtBtc(row.valueBtc)} · {row.txCount} tx
          </span>
          <span
            className={`addr-details__risk-dot addr-details__risk-dot--${riskLevel(
              row.riskScore
            )}`}
            title={`Risk ${row.riskScore}`}
          />
        </li>
      ))}
    </ul>
  )
}

export function AddressDetails({
  status,
  detail,
  error,
  onRetry,
  onSelectAddress,
  onClose,
}: AddressDetailsProps) {
  if (status === "idle" || (!detail && status !== "loading" && status !== "error")) {
    return (
      <aside className="addr-details addr-details--placeholder">
        <p className="eyebrow eyebrow--gold">Address Drill-down</p>
        <p className="addr-details__hint">
          Select an address node in the graph to inspect its flows, alerts and
          transaction history.
        </p>
      </aside>
    )
  }

  if (status === "loading") {
    return (
      <aside className="addr-details" aria-busy="true">
        <p className="eyebrow eyebrow--gold">Address Drill-down</p>
        <p className="addr-details__hint">Loading address…</p>
        <div className="addr-details__skeleton" />
        <div className="addr-details__skeleton" />
        <div className="addr-details__skeleton addr-details__skeleton--short" />
      </aside>
    )
  }

  if (status === "error") {
    return (
      <aside className="addr-details" role="alert">
        <p className="eyebrow eyebrow--gold">Address Drill-down</p>
        <p className="addr-details__error">{error ?? "Could not load this address."}</p>
        <button type="button" className="btn btn--gold" onClick={onRetry}>
          Retry
        </button>
      </aside>
    )
  }

  if (!detail) return null

  return (
    <aside className="addr-details">
      <div className="addr-details__head">
        <div>
          <p className="eyebrow eyebrow--gold">Address Drill-down</p>
          <p className="addr-details__addr">{detail.label}</p>
        </div>
        <button
          type="button"
          className="addr-details__close"
          aria-label="Clear selection"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div className="addr-details__summary">
        <span className={`pill pill--${RISK_LEVEL_PILL[detail.riskLevel]}`}>
          {RISK_LEVEL_LABEL[detail.riskLevel]}
        </span>
        <span className="addr-details__score">Score {detail.riskScore}</span>
        <span className="addr-details__category">{detail.category ?? "—"}</span>
      </div>

      <div className="addr-details__metrics">
        <div>
          <span className="addr-details__metric-value">{detail.txCount}</span>
          <span className="eyebrow">Transactions</span>
        </div>
        <div>
          <span className="addr-details__metric-value">{detail.incoming.length}</span>
          <span className="eyebrow">Incoming</span>
        </div>
        <div>
          <span className="addr-details__metric-value">{detail.outgoing.length}</span>
          <span className="eyebrow">Outgoing</span>
        </div>
        <div>
          <span className="addr-details__metric-value">
            {detail.connectedAddresses.length}
          </span>
          <span className="eyebrow">Connected</span>
        </div>
      </div>

      <section className="addr-details__block">
        <p className="eyebrow">Incoming flows</p>
        <FlowList
          rows={detail.incoming}
          emptyLabel="No incoming flows in view."
          onSelectAddress={onSelectAddress}
        />
      </section>

      <section className="addr-details__block">
        <p className="eyebrow">Outgoing flows</p>
        <FlowList
          rows={detail.outgoing}
          emptyLabel="No outgoing flows in view."
          onSelectAddress={onSelectAddress}
        />
      </section>

      <section className="addr-details__block">
        <p className="eyebrow">Connected addresses</p>
        {detail.connectedAddresses.length === 0 ? (
          <p className="addr-details__empty">None in view.</p>
        ) : (
          <div className="addr-details__chips">
            {detail.connectedAddresses.map((node) => (
              <button
                key={node.id}
                type="button"
                className={`addr-details__chip addr-details__chip--${riskLevel(
                  node.riskScore
                )}`}
                onClick={() => onSelectAddress(node.id)}
              >
                {node.label}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="addr-details__block">
        <p className="eyebrow">Alerts</p>
        {detail.alerts.length === 0 ? (
          <p className="addr-details__empty">No alerts for this address.</p>
        ) : (
          <ul className="addr-details__alerts">
            {detail.alerts.map((a) => (
              <li
                key={`${a.level}-${a.reason}`}
                className={`addr-details__alert addr-details__alert--${
                  alertTone[a.level] ?? "muted"
                }`}
              >
                <span className="addr-details__alert-level">{a.level}</span>
                <span>{a.reason}</span>
                <span className="addr-details__alert-score">SCORE {a.score}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="addr-details__block">
        <p className="eyebrow">Transaction history</p>
        {detail.history.length === 0 ? (
          <p className="addr-details__empty">No transactions in view.</p>
        ) : (
          <ul className="addr-details__history">
            {detail.history.map((h) => (
              <li key={h.tx} className="addr-details__hist-row">
                <span className="addr-details__mono">{h.time}</span>
                <span
                  className={`addr-details__dir addr-details__dir--${h.direction}`}
                >
                  {h.direction === "in" ? "◂ in" : "out ▸"}
                </span>
                <span className="addr-details__mono">{h.counterparty}</span>
                <span className="addr-details__mono">{h.amount}</span>
                <span className={`pill pill--${statusTone[h.status] ?? "muted"}`}>
                  {h.status}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="addr-details__note">
          {detail.history.length} shown — full paginated history pending backend.
        </p>
      </section>

      <section className="addr-details__block">
        <p className="eyebrow">Indicators</p>
        <dl className="addr-details__kv">
          <div>
            <dt>Received (in view)</dt>
            <dd>
              {detail.totalReceivedBtc != null
                ? fmtBtc(detail.totalReceivedBtc)
                : "—"}
            </dd>
          </div>
          <div>
            <dt>Sent (in view)</dt>
            <dd>
              {detail.totalSentBtc != null ? fmtBtc(detail.totalSentBtc) : "—"}
            </dd>
          </div>
          <div>
            <dt>First seen</dt>
            <dd>
              {detail.firstSeen ?? (
                <span className="addr-details__pending">pending backend</span>
              )}
            </dd>
          </div>
          <div>
            <dt>Last seen</dt>
            <dd>
              {detail.lastSeen ?? (
                <span className="addr-details__pending">pending backend</span>
              )}
            </dd>
          </div>
        </dl>
        {detail.riskFactors ? (
          <ul className="addr-details__factors">
            {detail.riskFactors.map((f) => (
              <li key={f.label}>
                <span>{f.label}</span>
                <span className="addr-details__factor-bar">
                  <span style={{ width: `${f.weight}%` }} />
                </span>
                <span>{f.weight}%</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="addr-details__pending">
            Per-address risk-factor breakdown pending backend —{" "}
            <code>GET /api/addresses/{"{id}"}</code>
          </p>
        )}
      </section>
    </aside>
  )
}
