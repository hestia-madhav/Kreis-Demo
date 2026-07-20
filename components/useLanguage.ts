"use client";

import { useState, useEffect, useCallback } from "react";

export type Lang = "en" | "kn";

const STORAGE_KEY = "kreis-demo-lang";

export function useLanguage() {
  const [lang, setLangState] = useState<Lang>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "kn") setLangState("kn");
    setReady(true);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const toggle = useCallback(() => {
    setLang(lang === "en" ? "kn" : "en");
  }, [lang, setLang]);

  return { lang, setLang, toggle, ready } as const;
}
