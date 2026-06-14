"""赛季路由：创建赛季、列出我的赛季、查看单个赛季。"""

from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.season import Season, SeasonParticipant
from app.models.user import User
from app.schemas.season import SeasonCreate, SeasonOut

router = APIRouter(prefix="/api/seasons", tags=["seasons"])


def _to_out(season: Season, today: date | None = None) -> SeasonOut:
    """把 Season ORM 转为带 is_finished 计算字段的输出模型。"""
    today = today or date.today()
    out = SeasonOut.model_validate(season)
    out.is_finished = today > season.end_date
    return out


@router.post("", response_model=SeasonOut, status_code=201)
def create_season(
    payload: SeasonCreate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """创建赛季，并加入参与者（基数体重在此登记）。"""
    end_date = payload.start_date + timedelta(weeks=payload.duration_weeks) - timedelta(days=1)
    season = Season(
        name=payload.name,
        start_date=payload.start_date,
        duration_weeks=payload.duration_weeks,
        end_date=end_date,
        created_by=current.id,
    )
    db.add(season)
    db.flush()

    # 校验参与用户存在，并去重
    seen: set[int] = set()
    for p in payload.participants:
        if p.user_id in seen:
            continue
        if db.get(User, p.user_id) is None:
            raise HTTPException(status_code=400, detail=f"用户 {p.user_id} 不存在")
        seen.add(p.user_id)
        db.add(
            SeasonParticipant(
                season_id=season.id,
                user_id=p.user_id,
                baseline_weight_kg=p.baseline_weight_kg,
            )
        )

    db.commit()
    db.refresh(season)
    return _to_out(season)


@router.get("", response_model=list[SeasonOut])
def list_my_seasons(db: Session = Depends(get_db), current: User = Depends(get_current_user)):
    """列出当前用户参与的所有赛季（按开始日期倒序）。"""
    seasons = (
        db.query(Season)
        .join(SeasonParticipant, SeasonParticipant.season_id == Season.id)
        .filter(SeasonParticipant.user_id == current.id)
        .order_by(Season.start_date.desc())
        .all()
    )
    return [_to_out(s) for s in seasons]


@router.get("/{season_id}", response_model=SeasonOut)
def get_season(
    season_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)
):
    """查看单个赛季详情。"""
    season = db.get(Season, season_id)
    if season is None:
        raise HTTPException(status_code=404, detail="赛季不存在")
    return _to_out(season)
