from pydantic import BaseModel
from typing import Optional


class CompositeStock(BaseModel):
    rank_overall: Optional[int] = None
    stock_code: str
    composite_score: Optional[float] = None
    composite_tier: Optional[str] = None
    daily_trigger_score: Optional[float] = None
    monthly_confirm_score: Optional[int] = None
    foreign_score: Optional[float] = None
    broker_score: Optional[int] = None
    whale_score: Optional[int] = None
    ksei_score: Optional[int] = None
    insider_score: Optional[int] = None
    stealth_quality: Optional[str] = None
    foreign_flow_direction: Optional[str] = None
    broker_phase: Optional[str] = None
    sector: Optional[str] = None
    group_name: Optional[str] = None
    close: Optional[float] = None
    change_percent: Optional[float] = None
    return_5d: Optional[float] = None
    return_20d: Optional[float] = None

    class Config:
        extra = "allow"


class MarketPulse(BaseModel):
    trading_date: Optional[str] = None
    market_phase: Optional[str] = None
    foreign_stance: Optional[str] = None
    breadth_score: Optional[float] = None
    timing_signal: Optional[str] = None
    total_foreign_net_miliar: Optional[float] = None
    gainers: Optional[int] = None
    losers: Optional[int] = None
    whale_count: Optional[int] = None

    class Config:
        extra = "allow"


class AlertSummary(BaseModel):
    stock_code: str
    alert_count: Optional[int] = None
    highest_severity: Optional[str] = None
    active_alerts: Optional[str] = None
    top_notification: Optional[str] = None
    composite_score: Optional[float] = None
    composite_tier: Optional[str] = None
    sector: Optional[str] = None
    close: Optional[float] = None
    change_percent: Optional[float] = None
    badge_color: Optional[str] = None
    alert_rank_score: Optional[float] = None

    class Config:
        extra = "allow"


class PaginatedResponse(BaseModel):
    data: list
    total: int
    page: int
    page_size: int


class DeepDiveSummary(BaseModel):
    stock_code: str
    composite_score: Optional[float] = None
    composite_tier: Optional[str] = None
    foreign_score: Optional[float] = None
    broker_score: Optional[int] = None
    whale_score: Optional[int] = None
    ksei_score: Optional[int] = None
    insider_score: Optional[int] = None
    price_score: Optional[int] = None
    stealth_quality: Optional[str] = None
    sector: Optional[str] = None
    group_name: Optional[str] = None
    close: Optional[float] = None
    change_percent: Optional[float] = None
    return_5d: Optional[float] = None
    return_20d: Optional[float] = None
    return_60d: Optional[float] = None

    class Config:
        extra = "allow"
