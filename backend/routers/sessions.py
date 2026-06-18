from __future__ import annotations
import os
import tempfile
import uuid

import pandas as pd
import pm4py
from fastapi import APIRouter, Form, HTTPException, UploadFile, File
from pm4py.objects.log.util import dataframe_utils

from models.schemas import SessionInfo
from services import log_service

router = APIRouter(prefix="/sessions", tags=["sessions"])


def session_to_info(session_id: str, session: dict) -> SessionInfo:
    orig_log = session["event_log"]
    filt_log = session["filtered_log"]
    total_cases = len(orig_log)
    total_events = sum(len(t) for t in orig_log)
    filtered_cases = len(filt_log)
    filtered_events = sum(len(t) for t in filt_log)

    df = session["dataframe"]
    activities: list[str] = []
    if "concept:name" in df.columns:
        activities = sorted(df["concept:name"].dropna().unique().tolist())

    return SessionInfo(
        sessionId=session_id,
        logName=session["log_name"],
        totalCases=total_cases,
        totalEvents=total_events,
        filteredCases=filtered_cases,
        filteredEvents=filtered_events,
        isFiltered=filtered_cases != total_cases,
        activities=activities,
    )


@router.post("/demo", response_model=SessionInfo)
def create_demo_session():
    session_id = str(uuid.uuid4())
    log, df = log_service.generate_demo_log()
    session = log_service.create_session(session_id, log, df, "Demo P2P Log")
    return session_to_info(session_id, session)


@router.post("/upload", response_model=SessionInfo)
async def upload_log(
    file: UploadFile = File(...),
    case_id_col: str = Form(...),
    activity_col: str = Form(...),
    timestamp_col: str = Form(...),
    resource_col: str = Form(""),
    cost_col: str = Form(""),
):
    session_id = str(uuid.uuid4())
    filename = file.filename or "uploaded_log"
    ext = filename.rsplit(".", 1)[-1].lower()
    content = await file.read()

    if ext == "xes":
        with tempfile.NamedTemporaryFile(suffix=".xes", delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        try:
            log = pm4py.read_xes(tmp_path)
        finally:
            os.unlink(tmp_path)
        df = pm4py.convert_to_dataframe(log)

    elif ext == "csv":
        import io
        df_raw = pd.read_csv(io.BytesIO(content))
        col_map: dict[str, str] = {
            case_id_col: "case:concept:name",
            activity_col: "concept:name",
            timestamp_col: "time:timestamp",
        }
        res_col = resource_col.strip()
        c_col = cost_col.strip()
        if res_col:
            col_map[res_col] = "org:resource"
        if c_col:
            col_map[c_col] = "case:cost"

        df_raw = df_raw.rename(columns=col_map)
        df_raw = dataframe_utils.convert_timestamp_columns_in_df(df_raw)
        df_raw = df_raw.sort_values(["case:concept:name", "time:timestamp"])

        df = pm4py.format_dataframe(
            df_raw,
            case_id="case:concept:name",
            activity_key="concept:name",
            timestamp_key="time:timestamp",
        )
        log = pm4py.convert_to_event_log(df)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format. Use CSV or XES.")

    session = log_service.create_session(
        session_id,
        log,
        df,
        filename,
        resource_col=res_col if ext == "csv" and res_col else None,
        cost_col=c_col if ext == "csv" and c_col else None,
    )
    return session_to_info(session_id, session)


@router.get("/{session_id}", response_model=SessionInfo)
def get_session(session_id: str):
    session = log_service.get_session(session_id)
    return session_to_info(session_id, session)
