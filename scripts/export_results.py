"""Copy the frozen thesis results into src/data/results/*.json for the app.

The app recomputes SA-CCR and BA-CVA itself (they are closed-form), but SA-CVA needs 200 000 Hull-White
paths, so its numbers come from the thesis pipeline. This script reads the most recent run folder of each
experiment in the thesis repo and writes compact JSON. Standard library only.

    python scripts/export_results.py [path/to/cva-capital-crr3]     # default: ../cva-capital-crr3
"""
from __future__ import annotations

import csv
import json
import math
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
THESIS = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE.parent / "cva-capital-crr3"
OUT = HERE / "src" / "data" / "results"

# Columns kept from the experiment files (the rest are diagnostics).
CAPITAL_COLS = [
    "scope", "approach", "hedge_ratio", "opt_in", "hedge_tenor", "hedge_notional_total",
    "k_ccs", "k_ir", "k_ir_vega", "cva_charge", "frtb_charge", "total_capital",
]


def parse(v: str):
    if v in ("", "nan", "NaN"):
        return None
    if v in ("True", "False"):
        return v == "True"
    try:
        x = float(v)
    except ValueError:
        return v
    if not math.isfinite(x):
        return None
    return round(x, 6)


def read(path: Path, cols: list[str] | None = None) -> list[dict]:
    with path.open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    keep = cols or (list(rows[0]) if rows else [])
    return [{k: parse(r[k]) for k in keep if k in r} for r in rows]


def latest(experiment: str) -> Path:
    runs = sorted(p for p in (THESIS / "results" / experiment).iterdir() if p.is_dir())
    if not runs:
        raise SystemExit(f"no run folder for {experiment}")
    return runs[-1] / "results.csv"


def main() -> None:
    if not (THESIS / "results").is_dir():
        raise SystemExit(f"thesis results not found under {THESIS}")
    OUT.mkdir(parents=True, exist_ok=True)
    files: dict[str, list[dict]] = {
        "scope": read(latest("A_scope"), CAPITAL_COLS),
        "hedgeLadder": read(latest("B_hedge_ladder"), CAPITAL_COLS),
        "matchedTenor": read(latest("E1_matched_tenor"), CAPITAL_COLS),
        "tenorSweep": read(latest("E2_tenor_sweep"), ["sizing"] + CAPITAL_COLS),
        "fixedNotional": read(latest("E2b_fixed_notional"), ["allocation", "notional_target"] + CAPITAL_COLS),
        "notionalLadder": read(latest("B2_notional_ladder"), ["tenor_mode", "allocation", "notional_target"] + CAPITAL_COLS),
        "exemptShare": read(latest("C_exempt_share"), ["exempt_share", "n_exempt"] + CAPITAL_COLS),
        "mixed": read(latest("F_mixed_approach"), [
            "scope", "opt_in", "tenor_mode", "hedge_ratio", "n_counterparties", "pure_sa_cva", "pure_ba_cva",
            "best_mixed", "n_sa", "gain_vs_best_pure_pct"]),
        "robustness": read(THESIS / "results" / "robustness" / "summary.csv", [
            "variation", "value", "approach", "hedge_ratio", "cva_charge", "frtb_charge", "total_capital", "pct_change"]),
        "regulatoryCva": read(THESIS / "results" / "regulatory_cva.csv"),
        "sensCcs": read(THESIS / "results" / "sensitivities_ccs.csv", ["counterparty", "vertex_years", "delta"]),
        "sensIr": read(THESIS / "results" / "sensitivities_ir.csv", ["counterparty", "vertex_years", "delta"]),
        "sensVega": read(THESIS / "results" / "sensitivities_vega.csv", ["counterparty", "vega"]),
    }
    # Exposure profiles: keep EE and PFE per counterparty, netting sets summed, yearly points are enough.
    prof: dict[str, dict[float, list[float]]] = {}
    for r in read(THESIS / "results" / "exposure_profiles.csv", ["counterparty", "t", "ee", "pfe"]):
        d = prof.setdefault(r["counterparty"], {})
        acc = d.setdefault(r["t"], [0.0, 0.0])
        acc[0] += r["ee"] or 0.0
        acc[1] += r["pfe"] or 0.0
    files["exposureProfiles"] = [
        {"counterparty": cp, "t": [t for t in sorted(d)], "ee": [round(d[t][0], 4) for t in sorted(d)],
         "pfe": [round(d[t][1], 4) for t in sorted(d)]}
        for cp, d in prof.items()
    ]
    for name, rows in files.items():
        (OUT / f"{name}.json").write_text(json.dumps(rows, separators=(",", ":")), encoding="utf-8")
        print(f"{name:18s} {len(rows):5d} rows")
    # Record where the numbers came from.
    sha = (THESIS / ".git" / "HEAD").read_text().strip()
    ref = THESIS / ".git" / sha.split(" ")[-1] if sha.startswith("ref:") else None
    commit = ref.read_text().strip() if ref and ref.exists() else sha
    (OUT / "source.json").write_text(json.dumps({"thesis_commit": commit, "run": latest("A_scope").parent.name}), encoding="utf-8")


if __name__ == "__main__":
    main()
