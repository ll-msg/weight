"""对抗与战报路由：计算双方评分、判定胜负。

对抗页与赛季战报页共用同一结果接口。
"""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.record import DailyRecord
from app.models.season import Season
from app.models.user import User
from app.schemas.report import CompetitionResult, ScoreBreakdown
from app.schemas.user import UserBrief
from app.services.scoring import compute_participant_score, decide_winner

router = APIRouter(prefix="/api/competition", tags=["competition"])


@router.get("/{season_id}", response_model=CompetitionResult)
def get_competition_result(
    season_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """计算某赛季所有参与者的评分明细与胜者。"""
    season = db.get(Season, season_id)
    if season is None:
        raise HTTPException(status_code=404, detail="赛季不存在")

    today = date.today()
    # 对抗与得分按「赛季结束日」与「今天」中较早者截止，避免把未来计入
    cutoff = min(today, season.end_date)

    scores: list[ScoreBreakdown] = []
    raw_scores: list[dict] = []
    for participant in season.participants:
        records = (
            db.query(DailyRecord)
            .filter(
                DailyRecord.user_id == participant.user_id,
                DailyRecord.season_id == season_id,
                DailyRecord.record_date <= cutoff,
            )
            .order_by(DailyRecord.record_date.asc())
            .all()
        )
        data = compute_participant_score(season, participant, records, cutoff)
        raw_scores.append(data)
        breakdown = ScoreBreakdown(**data)
        breakdown.user = UserBrief.model_validate(participant.user) if participant.user else None
        scores.append(breakdown)

    winner_id, is_tie = decide_winner(raw_scores)

    return CompetitionResult(
        season_id=season.id,
        season_name=season.name,
        is_finished=today > season.end_date,
        scores=scores,
        winner_user_id=winner_id,
        is_tie=is_tie,
    )
