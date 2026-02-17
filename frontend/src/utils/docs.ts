import type { DocumentationEntry } from "../types";
import type { Language } from "../i18n";

export const resolveDocTitle = (
  entry: DocumentationEntry,
  language: Language,
) => {
  if (language === "en") {
    return entry.titleEn || entry.title;
  }
  if (language === "ca") {
    return entry.titleCa || entry.title;
  }
  return entry.title;
};

export const resolveDocContent = (
  entry: DocumentationEntry,
  language: Language,
) => {
  if (language === "en") {
    return entry.contentEn || entry.content;
  }
  if (language === "ca") {
    return entry.contentCa || entry.content;
  }
  return entry.content;
};

export const resolveDocEntry = (
  entry: DocumentationEntry,
  language: Language,
) => ({
  ...entry,
  title: resolveDocTitle(entry, language),
  content: resolveDocContent(entry, language),
});
