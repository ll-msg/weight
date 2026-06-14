"use client";

// 食谱编辑器：增删多条餐食记录。

import type { Meal } from "@/lib/types";
import { MEAL_LABELS } from "@/lib/utils";

interface Props {
  meals: Meal[];
  onChange: (meals: Meal[]) => void;
}

export default function MealsEditor({ meals, onChange }: Props) {
  function addMeal() {
    onChange([...meals, { meal_type: "breakfast", description: "", calories: null }]);
  }
  function update(index: number, patch: Partial<Meal>) {
    onChange(meals.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  }
  function remove(index: number) {
    onChange(meals.filter((_, i) => i !== index));
  }

  return (
    <div>
      {meals.length === 0 && <p className="muted" style={{ fontSize: 13 }}>还没有记录餐食</p>}
      {meals.map((m, i) => (
        <div key={i} style={{ background: "#f9fafb", borderRadius: 12, padding: 10, marginBottom: 10 }}>
          <div className="row" style={{ marginBottom: 8 }}>
            <select value={m.meal_type} onChange={(e) => update(i, { meal_type: e.target.value })}>
              {Object.entries(MEAL_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="千卡(可选)"
              value={m.calories ?? ""}
              onChange={(e) => update(i, { calories: e.target.value ? parseInt(e.target.value) : null })}
            />
          </div>
          <textarea
            placeholder="吃了什么…"
            value={m.description}
            onChange={(e) => update(i, { description: e.target.value })}
          />
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(i)} style={{ color: "var(--danger)" }}>
            删除
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-secondary btn-sm" onClick={addMeal}>
        + 添加一餐
      </button>
    </div>
  );
}
