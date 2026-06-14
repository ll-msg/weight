"use client";

// 语言上下文：提供当前语言、切换方法、翻译函数 t()。
// 语言持久化到 localStorage，默认中文。

import { createContext, useContext, useEffect, useState } from "react";

import { LOCALES, type Lang } from "./locales";

const STORAGE_KEY = "lw_lang";

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  // 翻译：t("a.b", { n: 3 }) 会把文案中的 {n} 替换为 3
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("zh");

  // 首次加载时从 localStorage 恢复
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "zh" || saved === "en") setLangState(saved);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
    document.documentElement.lang = l === "zh" ? "zh-CN" : "en";
  }

  function toggle() {
    setLang(lang === "zh" ? "en" : "zh");
  }

  function t(key: string, params?: Record<string, string | number>): string {
    let s = LOCALES[lang][key] ?? LOCALES.zh[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      }
    }
    return s;
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, toggle, t }}>{children}</I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n 必须在 I18nProvider 内使用");
  return ctx;
}
