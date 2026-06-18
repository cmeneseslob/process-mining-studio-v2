from __future__ import annotations
import random
import uuid
from datetime import datetime, timedelta

import pandas as pd
import pm4py
from fastapi import HTTPException
from pm4py.objects.log.util import dataframe_utils

from models.schemas import FilterRequest

SESSIONS: dict[str, dict] = {}


def create_session(
    session_id: str,
    log,
    df: pd.DataFrame,
    log_name: str,
    resource_col: str | None = None,
    cost_col: str | None = None,
) -> dict:
    session = {
        "event_log": log,
        "filtered_log": log,
        "dataframe": df,
        "log_name": log_name,
        "resource_col": resource_col,
        "cost_col": cost_col,
    }
    SESSIONS[session_id] = session
    return session


def get_session(session_id: str) -> dict:
    session = SESSIONS.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail=f"Session '{session_id}' not found")
    return session


def reset_filters(session_id: str) -> dict:
    session = get_session(session_id)
    session["filtered_log"] = session["event_log"]
    return session


def apply_filters(session_id: str, filter_req: FilterRequest) -> dict:
    session = get_session(session_id)
    filtered = session["event_log"]

    if filter_req.dateFrom and filter_req.dateTo:
        try:
            dt_min = pd.Timestamp(filter_req.dateFrom).tz_localize("UTC")
            dt_max = pd.Timestamp(filter_req.dateTo).replace(hour=23, minute=59, second=59).tz_localize("UTC")
            filtered = pm4py.filter_time_range(filtered, dt_min, dt_max, mode="traces_contained")
        except Exception:
            pass

    if filter_req.minDurationDays is not None and filter_req.maxDurationDays is not None:
        try:
            filtered = pm4py.filter_case_performance(
                filtered,
                min_performance=filter_req.minDurationDays * 86400,
                max_performance=filter_req.maxDurationDays * 86400,
            )
        except Exception:
            pass

    if filter_req.startActivity:
        try:
            filtered = pm4py.filter_start_activities(filtered, [filter_req.startActivity])
        except Exception:
            pass

    if filter_req.endActivity:
        try:
            filtered = pm4py.filter_end_activities(filtered, [filter_req.endActivity])
        except Exception:
            pass

    if filter_req.requiredActivities:
        try:
            filtered = pm4py.filter_event_attribute_values(
                filtered, "concept:name", filter_req.requiredActivities, level="case", retain=True
            )
        except Exception:
            pass

    session["filtered_log"] = filtered
    return session


def generate_demo_log():
    random.seed(42)

    activities = [
        "Create Purchase Requisition",
        "Approve Requisition",
        "Create Purchase Order",
        "Send Order to Supplier",
        "Receive Goods",
        "Receive Invoice",
        "Match Invoice",
        "Approve Payment",
        "Process Payment",
    ]

    variants = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8],
        [0, 1, 2, 3, 5, 4, 6, 7, 8],
        [0, 2, 3, 4, 5, 6, 7, 8],
        [0, 1, 2, 3, 4, 5, 6, 8],
        [0, 1, 2, 3, 4, 5, 7, 8],
        [0, 1, 2, 5, 6, 7, 8],
    ]
    weights = [40, 20, 15, 10, 8, 7]

    rows = []
    n_cases = 500
    base_time = datetime(2024, 1, 1)

    for i in range(n_cases):
        case_id = f"CASE-{i+1:04d}"
        variant = random.choices(variants, weights=weights, k=1)[0]
        t = base_time + timedelta(days=random.randint(0, 364))
        for step in variant:
            rows.append(
                {
                    "case:concept:name": case_id,
                    "concept:name": activities[step],
                    "time:timestamp": t,
                    "org:resource": f"User-{random.randint(1, 10):02d}",
                    "cost": round(random.uniform(100, 5000), 2),
                }
            )
            t += timedelta(hours=random.randint(1, 48))

    df = pd.DataFrame(rows)
    df = pm4py.format_dataframe(
        df,
        case_id="case:concept:name",
        activity_key="concept:name",
        timestamp_key="time:timestamp",
    )
    log = pm4py.convert_to_event_log(df)
    return log, df
