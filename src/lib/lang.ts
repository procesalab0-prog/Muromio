export type Lang = "es" | "en";

export type Translate = (es: string, en: string) => string;

export function makeTranslate(lang: Lang): Translate {
  return (es, en) => (lang === "en" ? en : es);
}
