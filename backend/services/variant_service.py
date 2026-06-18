from __future__ import annotations
import pm4py
from models.schemas import VariantRow, VariantsResponse


def build_variants_response(log) -> VariantsResponse:
    variants_dict = pm4py.get_variants(log)
    total_cases = len(log)

    variants_sorted = sorted(variants_dict.items(), key=lambda x: len(x[1]), reverse=True)

    rows: list[VariantRow] = []
    cumulative = 0.0
    for i, (variant, cases) in enumerate(variants_sorted):
        count = len(cases)
        pct = count / total_cases * 100 if total_cases else 0.0
        cumulative += pct
        steps = variant if isinstance(variant, tuple) else (variant,)
        rows.append(
            VariantRow(
                id=i + 1,
                flow=list(steps),
                flowStr=" → ".join(steps),
                count=count,
                percentage=round(pct, 2),
                cumulativePercentage=round(cumulative, 2),
                steps=len(steps),
            )
        )

    top5_cases = sum(r.count for r in rows[:5])
    top5_coverage = top5_cases / total_cases * 100 if total_cases else 0.0

    return VariantsResponse(
        variants=rows,
        totalCases=total_cases,
        totalVariants=len(rows),
        top5Coverage=round(top5_coverage, 2),
    )
