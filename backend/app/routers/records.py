"""每日记录路由：新增/更新某天记录、查询记录。"""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models.record import DailyRecord, MealRecord
from app.models.season import SeasonParticipant
from app.models.user import User
from app.schemas.record import DailyRecordOut, DailyRecordUpsert

router = APIRouter(prefix="/api/records", tags=["records"])


def _ensure_participant(db: Session, user_id: int, season_id: int) -> None:
    """确认该用户确实是该赛季的参与者。"""
    p = (
        db.query(SeasonParticipant)
        .filter(
            SeasonParticipant.season_id == season_id,
            SeasonParticipant.user_id == user_id,
        )
        .first()
    )
    if p is None:
        raise HTTPException(status_code=403, detail="你不是该赛季的参与者")


@router.put("", response_model=DailyRecordOut)
def upsert_record(
    payload: DailyRecordUpsert,
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """新增或更新当前用户在某赛季某天的记录（含整组餐食覆盖）。"""
    _ensure_participant(db, current.id, payload.season_id)

    record = (
        db.query(DailyRecord)
        .filter(
            DailyRecord.user_id == current.id,
            DailyRecord.season_id == payload.season_id,
            DailyRecord.record_date == payload.record_date,
        )
        .first()
    )
    if record is None:
        record = DailyRecord(
            user_id=current.id,
            season_id=payload.season_id,
            record_date=payload.record_date,
        )
        db.add(record)

    # 更新标量字段
    record.weight_kg = payload.weight_kg
    record.water_ml = payload.water_ml
    record.exercise_minutes = payload.exercise_minutes
    record.exercise_kcal = payload.exercise_kcal
    record.steps = payload.steps
    record.sleep_hours = payload.sleep_hours
    record.mood = payload.mood
    record.notes = payload.notes

    db.flush()

    # 餐食整组覆盖：先删旧的，再写新的
    record.meals.clear()
    db.flush()
    for m in payload.meals:
        record.meals.append(MealRecord(**m.model_dump()))

    db.commit()
    db.refresh(record)
    return record


@router.get("", response_model=list[DailyRecordOut])
def list_records(
    season_id: int = Query(...),
    user_id: int | None = Query(None, description="不传则查自己；对抗页传对手 id"),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """查询某赛季内某用户的全部每日记录（按日期升序）。"""
    target_user = user_id or current.id
    _ensure_participant(db, target_user, season_id)
    records = (
        db.query(DailyRecord)
        .filter(DailyRecord.user_id == target_user, DailyRecord.season_id == season_id)
        .order_by(DailyRecord.record_date.asc())
        .all()
    )
    return records


@router.get("/day", response_model=DailyRecordOut | None)
def get_day(
    season_id: int = Query(...),
    record_date: date = Query(...),
    user_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current: User = Depends(get_current_user),
):
    """查询某用户某天的单条记录，没有则返回 null。"""
    target_user = user_id or current.id
    _ensure_participant(db, target_user, season_id)
    record = (
        db.query(DailyRecord)
        .filter(
            DailyRecord.user_id == target_user,
            DailyRecord.season_id == season_id,
            DailyRecord.record_date == record_date,
        )
        .first()
    )
    return record
