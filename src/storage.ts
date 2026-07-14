import { EMPTY_ANSWERS } from './data';
import type { Answers, TextScale, ThemeMode } from './types';

const ANSWERS_KEY = 'chromiview.answers.v2';
const HISTORY_KEY = 'chromiview.history.v1';
const SETTINGS_KEY = 'chromiview.settings.v1';

export function loadAnswers(): Answers {
  try {
    const raw = localStorage.getItem(ANSWERS_KEY);
    return raw ? { ...EMPTY_ANSWERS, ...JSON.parse(raw) } : { ...EMPTY_ANSWERS };
  } catch {
    return { ...EMPTY_ANSWERS };
  }
}

export function saveAnswers(answers: Answers) {
  localStorage.setItem(ANSWERS_KEY, JSON.stringify(answers));
}

export function clearLocalData() {
  localStorage.removeItem(ANSWERS_KEY);
  localStorage.removeItem(HISTORY_KEY);
}

export function saveHistory(report: unknown) {
  const current = loadHistory();
  localStorage.setItem(HISTORY_KEY, JSON.stringify([report, ...current].slice(0, 5)));
}

export function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') as unknown[];
  } catch {
    return [];
  }
}

export function loadSettings(): { theme: ThemeMode; textScale: TextScale } {
  try {
    return { theme: 'light', textScale: 'normal', ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch {
    return { theme: 'light', textScale: 'normal' };
  }
}

export function saveSettings(settings: { theme: ThemeMode; textScale: TextScale }) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
