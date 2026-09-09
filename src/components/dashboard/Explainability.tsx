import { explainability } from "@/lib/dashboardData"

export function Explainability() {
  return (
    <section id="explainability" className="panel explain">
      <p className="eyebrow eyebrow--gold">Explainability</p>
      <p className="explain__question">{explainability.question}</p>

      <ul className="explain__list">
        {explainability.factors.map((factor) => (
          <li key={factor.label} className="explain__row">
            <span className="explain__label">{factor.label}</span>
            <span className="explain__track" aria-hidden="true">
              <span
                className="explain__fill"
                style={{ width: `${factor.weight}%` }}
              />
            </span>
            <span className="explain__weight">{factor.weight}%</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
