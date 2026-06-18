from __future__ import annotations
from fastapi import APIRouter

from models.schemas import DFGResponse, FilterRequest, PerformanceResponse, SessionInfo, VariantsResponse
from services import dfg_service, log_service, performance_service, variant_service
from routers.sessions import session_to_info

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.get("/{session_id}/dfg", response_model=DFGResponse)
def get_dfg(
    session_id: str,
    mode: str = "frequency",
    activities_pct: int = 80,
    paths_pct: int = 80,
):
    session = log_service.get_session(session_id)
    log = session["filtered_log"]
    return dfg_service.build_dfg_response(log, mode, activities_pct, paths_pct)


@router.get("/{session_id}/variants", response_model=VariantsResponse)
def get_variants(session_id: str):
    session = log_service.get_session(session_id)
    log = session["filtered_log"]
    return variant_service.build_variants_response(log)


@router.get("/{session_id}/performance", response_model=PerformanceResponse)
def get_performance(session_id: str):
    session = log_service.get_session(session_id)
    log = session["filtered_log"]
    return performance_service.build_performance_response(log)


@router.post("/{session_id}/filters", response_model=SessionInfo)
def apply_filters(session_id: str, filter_req: FilterRequest):
    session = log_service.apply_filters(session_id, filter_req)
    return session_to_info(session_id, session)


@router.delete("/{session_id}/filters", response_model=SessionInfo)
def reset_filters(session_id: str):
    session = log_service.reset_filters(session_id)
    return session_to_info(session_id, session)
