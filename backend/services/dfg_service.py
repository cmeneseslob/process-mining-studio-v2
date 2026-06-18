from __future__ import annotations
import pm4py
from models.schemas import DFGEdge, DFGNode, DFGResponse


def filter_dfg(
    dfg: dict,
    start_activities: dict,
    end_activities: dict,
    activities_pct: int,
    paths_pct: int,
) -> tuple[dict, dict, dict]:
    if not dfg:
        return dfg, start_activities, end_activities

    act_weight: dict = {}
    for (src, tgt), w in dfg.items():
        val = w if isinstance(w, (int, float)) else (w.get("mean", 0) if isinstance(w, dict) else 0)
        act_weight[src] = act_weight.get(src, 0) + val
        act_weight[tgt] = act_weight.get(tgt, 0) + val

    for act, cnt in start_activities.items():
        act_weight[act] = act_weight.get(act, 0) + cnt

    n_acts = len(act_weight)
    n_keep_acts = max(1, round(n_acts * activities_pct / 100))
    top_acts = set(sorted(act_weight, key=act_weight.get, reverse=True)[:n_keep_acts])

    arcs = {k: v for k, v in dfg.items() if k[0] in top_acts and k[1] in top_acts}

    n_keep_paths = max(1, round(len(arcs) * paths_pct / 100))
    sorted_arcs = sorted(
        arcs.items(),
        key=lambda x: x[1] if isinstance(x[1], (int, float)) else (x[1].get("mean", 0) if isinstance(x[1], dict) else 0),
        reverse=True,
    )
    arcs = dict(sorted_arcs[:n_keep_paths])

    f_start = {a: c for a, c in start_activities.items() if a in top_acts}
    f_end = {a: c for a, c in end_activities.items() if a in top_acts}

    return arcs, f_start, f_end


def _edge_value(raw) -> float:
    if isinstance(raw, dict):
        return float(raw.get("mean", 0))
    if isinstance(raw, (int, float)):
        return float(raw)
    return 0.0


def build_dfg_response(log, mode: str, activities_pct: int, paths_pct: int) -> DFGResponse:
    if mode == "performance":
        raw_dfg, start_acts, end_acts = pm4py.discover_performance_dfg(log)
    else:
        raw_dfg, start_acts, end_acts = pm4py.discover_dfg(log)

    f_dfg, f_start, f_end = filter_dfg(raw_dfg, start_acts, end_acts, activities_pct, paths_pct)

    # Build activity weight map for node values
    act_weight: dict[str, float] = {}
    for (src, tgt), w in f_dfg.items():
        val = _edge_value(w)
        act_weight[src] = act_weight.get(src, 0.0) + val
        act_weight[tgt] = act_weight.get(tgt, 0.0) + val

    all_acts = {a for edge in f_dfg for a in edge}

    nodes = [
        DFGNode(
            id=act,
            label=act,
            value=act_weight.get(act, 0.0),
            isStart=act in f_start,
            isEnd=act in f_end,
        )
        for act in all_acts
    ]

    edges = [
        DFGEdge(
            id=f"{src}--{tgt}",
            source=src,
            target=tgt,
            value=_edge_value(w),
        )
        for (src, tgt), w in f_dfg.items()
    ]

    return DFGResponse(
        nodes=nodes,
        edges=edges,
        mode=mode,
        totalCases=len(log),
        visibleActivities=len(nodes),
        visibleArcs=len(edges),
    )
