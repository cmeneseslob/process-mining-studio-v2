from __future__ import annotations
import numpy as np
import pandas as pd
import pm4py
from models.schemas import (
    ActivityFreq,
    HistogramBin,
    PercentilePoint,
    PerformanceKPIs,
    PerformanceResponse,
    WorkloadPoint,
)


def build_performance_response(log) -> PerformanceResponse:
    raw_durations = pm4py.get_all_case_durations(log, business_hours=False)
    durations_sec = list(raw_durations) if raw_durations else []
    durations_days = [d / 86400 for d in durations_sec]

    total_cases = len(log)
    total_events = sum(len(t) for t in log)
    mean_dur = float(np.mean(durations_sec)) if durations_sec else 0.0
    median_dur = float(np.median(durations_sec)) if durations_sec else 0.0
    min_dur = float(np.min(durations_sec)) if durations_sec else 0.0
    max_dur = float(np.max(durations_sec)) if durations_sec else 0.0

    kpis = PerformanceKPIs(
        meanDuration=mean_dur,
        medianDuration=median_dur,
        minDuration=min_dur,
        maxDuration=max_dur,
        totalCases=total_cases,
        totalEvents=total_events,
    )

    # Histogram
    histogram: list[HistogramBin] = []
    if durations_days:
        counts, bin_edges = np.histogram(durations_days, bins=50)
        for i, cnt in enumerate(counts):
            b_start = float(bin_edges[i])
            b_end = float(bin_edges[i + 1])
            histogram.append(
                HistogramBin(
                    binLabel=f"{b_start:.1f}–{b_end:.1f}d",
                    count=int(cnt),
                    binStart=b_start,
                    binEnd=b_end,
                )
            )

    # Workload
    workload: list[WorkloadPoint] = []
    df = pm4py.convert_to_dataframe(log)
    ts_col = "time:timestamp"
    case_col = "case:concept:name"
    if ts_col in df.columns and case_col in df.columns:
        df[ts_col] = pd.to_datetime(df[ts_col], utc=True, errors="coerce")
        df = df.dropna(subset=[ts_col])
        case_range = df.groupby(case_col)[ts_col].agg(start="min", end="max").reset_index()
        if not case_range.empty:
            min_t = case_range["start"].min()
            max_t = case_range["end"].max()
            timeline = pd.date_range(start=min_t, end=max_t, periods=120)
            for t in timeline:
                active = int(((case_range["start"] <= t) & (case_range["end"] >= t)).sum())
                workload.append(WorkloadPoint(date=t.isoformat(), activeCases=active))

    # Percentiles
    percentile_points: list[PercentilePoint] = []
    if durations_days:
        for p in [10, 25, 50, 75, 90, 95, 99]:
            val = float(np.percentile(durations_days, p))
            percentile_points.append(PercentilePoint(p=p, valueDays=round(val, 3)))

    # Activity frequency
    activity_freq: list[ActivityFreq] = []
    if "concept:name" in df.columns:
        counts_series = df["concept:name"].value_counts().head(20)
        for act, cnt in counts_series.items():
            activity_freq.append(ActivityFreq(activity=str(act), count=int(cnt)))

    return PerformanceResponse(
        kpis=kpis,
        histogram=histogram,
        workload=workload,
        percentiles=percentile_points,
        activityFrequency=activity_freq,
    )
