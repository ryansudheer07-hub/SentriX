"use client"

import { useState } from "react"

import { searchPlaceholder } from "@/lib/dashboardData"
import { requestTxAnalysis } from "@/lib/txAnalysis"
import { SearchIcon } from "../icons"

/**
 * The hero's global search. Submitting a query (Enter or "Investigate") fires
 * `requestTxAnalysis`, which the Transaction Analysis section picks up. Keeps
 * the `.dash-search__input` class the command palette focuses.
 */
export function DashboardSearch() {
  const [q, setQ] = useState("")

  return (
    <form
      className="dash-search"
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        requestTxAnalysis(q)
      }}
    >
      <SearchIcon size={15} className="dash-search__icon" />
      <input
        className="dash-search__input"
        type="text"
        placeholder={searchPlaceholder}
        aria-label={searchPlaceholder}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <button type="submit" className="btn btn--gold">
        Investigate
      </button>
    </form>
  )
}
