import { useSettingsStore } from '@/stores/useSettingsStore';
import zhCN from './locales/zh-CN';
import enUS from './locales/en-US';

export type Locale = 'zh-CN' | 'en-US';

export const locales: Record<Locale, Record<string, string>> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

export const localeNames: Record<Locale, string> = {
  'zh-CN': '简体中文',
  'en-US': 'English',
};

export function useI18n() {
  const language = useSettingsStore((s) => s.language) as Locale;
  const dict = locales[language] || locales['zh-CN'];

  const t = (key: string, fallback?: string): string => {
    return dict[key] ?? fallback ?? key;
  };

  return { t, language, locale: dict };
}
