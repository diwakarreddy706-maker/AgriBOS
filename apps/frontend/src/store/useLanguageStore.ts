import { create } from 'zustand';
import { en } from '../localization/en';
import { kn } from '../localization/kn';

type Language = 'en' | 'kn';

interface LanguageState {
  language: Language;
  t: typeof en;
  setLanguage: (lang: Language) => void;
}

const savedLang = (localStorage.getItem('agribos_lang') as Language) || 'en';

export const useLanguageStore = create<LanguageState>((set) => ({
  language: savedLang,
  t: savedLang === 'kn' ? kn : en,
  setLanguage: (lang) => {
    localStorage.setItem('agribos_lang', lang);
    set({ language: lang, t: lang === 'kn' ? kn : en });
  },
}));
