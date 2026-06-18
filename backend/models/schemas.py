from __future__ import annotations
from pydantic import BaseModel


class SessionInfo(BaseModel):
    sessionId: str
    logName: str
    totalCases: int
    totalEvents: int
    filteredCases: int
    filteredEvents: int
    isFiltered: bool
    activities: list[str]


class DFGNode(BaseModel):
    id: str
    label: str
    value: float
    isStart: bool
    isEnd: bool


class DFGEdge(BaseModel):
    id: str
    source: str
    target: str
    value: float


class DFGResponse(BaseModel):
    nodes: list[DFGNode]
    edges: list[DFGEdge]
    mode: str
    totalCases: int
    visibleActivities: int
    visibleArcs: int


class VariantRow(BaseModel):
    id: int
    flow: list[str]
    flowStr: str
    count: int
    percentage: float
    cumulativePercentage: float
    steps: int


class VariantsResponse(BaseModel):
    variants: list[VariantRow]
    totalCases: int
    totalVariants: int
    top5Coverage: float


class PerformanceKPIs(BaseModel):
    meanDuration: float
    medianDuration: float
    minDuration: float
    maxDuration: float
    totalCases: int
    totalEvents: int


class HistogramBin(BaseModel):
    binLabel: str
    count: int
    binStart: float
    binEnd: float


class WorkloadPoint(BaseModel):
    date: str
    activeCases: int


class PercentilePoint(BaseModel):
    p: int
    valueDays: float


class ActivityFreq(BaseModel):
    activity: str
    count: int


class PerformanceResponse(BaseModel):
    kpis: PerformanceKPIs
    histogram: list[HistogramBin]
    workload: list[WorkloadPoint]
    percentiles: list[PercentilePoint]
    activityFrequency: list[ActivityFreq]


class FilterRequest(BaseModel):
    dateFrom: str | None = None
    dateTo: str | None = None
    minDurationDays: float | None = None
    maxDurationDays: float | None = None
    startActivity: str | None = None
    endActivity: str | None = None
    requiredActivities: list[str] = []
