"""赛季路由：创建赛季、列出我的赛季、查看单个赛季。"""

from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.i18n import get_lang, translate
from app.database import get_db
from app.deps import get_current_user
from app.models.record import DailyRecord
from app.models.season import Season, SeasonParticipant
from app.models.user import User
from app.schemas.season import SeasonCreate, SeasonOut

router = APIRouter(prefix="/api/seasons", tags=["seasons"])


def _to_out(season: Season, today: date | None = None) -> SeasonOut:
    """把 Season ORM 转为带 is_finished 计算字段的输出模型。"""
    today = today or date.today()
    out = SeasonOut.model_validate(season)
    # 到期 或 双方同意提前结束 都视为已结束
    out.is_finished = today > season.end_date or season.ended_early
    return out


def _get_my_participant(season: Season, user_id: int) -> SeasonParticipant | None:
    return next((p for p in season.participants if p.user_id == user_id), None)


@router.post("", response_model=SeasonOut, status_code=201)
def create_season(
    payload: SeasonCreate,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
    lang: str = Depends(get_lang),
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
            raise HTTPException(
                status_code=400, detail=translate("user_id_not_found", lang, id=p.user_id)
            )
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
    season_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
    lang: str = Depends(get_lang),
):
    """查看单个赛季详情。"""
    season = db.get(Season, season_id)
    if season is None:
        raise HTTPException(status_code=404, detail=translate("season_not_found", lang))
    return _to_out(season)


@router.post("/{season_id}/end-request", response_model=SeasonOut)
def request_end(
    season_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
    lang: str = Depends(get_lang),
):
    """申请提前结束赛季。当所有参与者都申请后，赛季立即结束并按当前进度结算。"""
    season = db.get(Season, season_id)
    if season is None:
        raise HTTPException(status_code=404, detail=translate("season_not_found", lang))
    me = _get_my_participant(season, current.id)
    if me is None:
        raise HTTPException(status_code=403, detail=translate("not_participant", lang))

    # 已结束则直接返回当前状态
    if not (season.ended_early or date.today() > season.end_date):
        me.wants_end = True
        db.flush()
        # 双方（全体）都同意 → 提前结束：标记并把结束日设为今天
        if season.participants and all(p.wants_end for p in season.participants):
            season.ended_early = True
            season.end_date = date.today()
        db.commit()
        db.refresh(season)
    return _to_out(season)


@router.post("/{season_id}/end-cancel", response_model=SeasonOut)
def cancel_end(
    season_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
    lang: str = Depends(get_lang),
):
    """撤销自己的「提前结束」申请（赛季尚未结束时有效）。"""
    season = db.get(Season, season_id)
    if season is None:
        raise HTTPException(status_code=404, detail=translate("season_not_found", lang))
    me = _get_my_participant(season, current.id)
    if me is None:
        raise HTTPException(status_code=403, detail=translate("not_participant", lang))
    if not season.ended_early:
        me.wants_end = False
        db.commit()
        db.refresh(season)
    return _to_out(season)


@router.delete("/{season_id}", status_code=204)
def delete_season(
    season_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
    lang: str = Depends(get_lang),
):
    """删除赛季（仅创建者或参与者可删）。会一并清除该赛季的所有每日记录与餐食。"""
    season = db.get(Season, season_id)
    if season is None:
        raise HTTPException(status_code=404, detail=translate("season_not_found", lang))

    allowed = season.created_by == current.id or any(
        p.user_id == current.id for p in season.participants
    )
    if not allowed:
        raise HTTPException(status_code=403, detail=translate("no_permission", lang))

    # 先删每日记录（其餐食通过关系级联删除），再删赛季（参与者随 Season 关系级联删除）
    for rec in db.query(DailyRecord).filter(DailyRecord.season_id == season_id).all():
        db.delete(rec)
    db.delete(season)
    db.commit()
