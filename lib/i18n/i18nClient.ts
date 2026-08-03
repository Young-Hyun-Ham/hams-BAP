'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { languageService } from '@/lib/api/services/languageService';

export const SUPPORTED_LANGS = ['en', 'ko', 'vi'];

i18n.use(initReactI18next);

export async function initI18n(
  isAuthenticated: boolean,
  currentLanguage: string,
) {
  try {
    const defaultLang = currentLanguage ?? 'en';

    await i18n.init({
      lng: defaultLang,
      fallbackLng: 'en',
      supportedLngs: SUPPORTED_LANGS,
      debug: false,
      returnNull: false, // 키를 반환하도록 설정
      returnEmptyString: false, // 빈 문자열 대신 키 반환
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
      resources: {}, // Empty, will be loaded via API
    });

    if (isAuthenticated) {
      // ✅ API 호출 (브라우저에서만 실행)
      //const result = await languageService.getMultiLang(defaultLang);
      //i18n.addResourceBundle(defaultLang, 'translation', result, true, true);      const result: any = await languageService.getMultiLang(defaultLang);

      console.log('i18n lang: ' + defaultLang);

      const result: any = await languageService.getMultiLang(defaultLang);
      let resourceObj: Record<string, string> = {};

      if (Array.isArray(result)) {
        resourceObj = result.reduce<Record<string, string>>((acc, cur) => {
          const k = (cur as any).key ?? (cur as any).Key;
          const v = (cur as any).value ?? (cur as any).Value ?? '';
          if (k) acc[String(k)] = String(v);
          return acc;
        }, {});
      } else if (result && typeof result === 'object') {
        resourceObj = Object.keys(result).reduce<Record<string, string>>(
          (acc, k) => {
            const v = (result as any)[k];
            acc[k] = v == null ? '' : String(v);
            return acc;
          },
          {},
        );
      }

      const supported = Array.isArray(i18n.options.supportedLngs)
        ? i18n.options.supportedLngs
        : [];

      supported.forEach((lng) => {
        if (lng !== defaultLang && i18n.hasResourceBundle(lng, 'translation')) {
          i18n.removeResourceBundle(lng, 'translation');
        }
      });

      if (i18n.hasResourceBundle(defaultLang, 'translation')) {
        i18n.removeResourceBundle(defaultLang, 'translation');
      }

      i18n.addResourceBundle(
        defaultLang,
        'translation',
        resourceObj,
        true,
        true,
      );
    }
    await i18n.changeLanguage(defaultLang);
    console.log('i18n initialized successfully');
  } catch (err) {
    console.error('i18n initialization error:', err);
  }
}

export async function loadLanguageData(lang: string) {
  try {
    // ⚙️ 2. API 호출
    //const result = await languageService.getMultiLang(lang);
    const result: any = await languageService.getMultiLang(lang);
    // 예: [{ key: 'HELLO', value: '안녕' }, { key: 'SAVE', value: '저장' }]

    let resourceObj: Record<string, string> = {};

    if (Array.isArray(result)) {
      resourceObj = result.reduce<Record<string, string>>((acc, cur) => {
        const k = (cur as any).key ?? (cur as any).Key;
        const v = (cur as any).value ?? (cur as any).Value ?? '';
        if (k) acc[String(k)] = String(v);
        return acc;
      }, {});
    } else if (result && typeof result === 'object') {
      resourceObj = Object.keys(result).reduce<Record<string, string>>(
        (acc, k) => {
          const v = (result as any)[k];
          acc[k] = v == null ? '' : String(v);
          return acc;
        },
        {},
      );
    }

    const supported = Array.isArray(i18n.options.supportedLngs)
      ? i18n.options.supportedLngs
      : [];
    supported.forEach((lng) => {
      if (lng !== lang && i18n.hasResourceBundle(lng, 'translation')) {
        i18n.removeResourceBundle(lng, 'translation');
      }
    });

    // ⚙️ 3. i18next 리소스 주입
    i18n.addResourceBundle(lang, 'translation', resourceObj, true, true);
    i18n.changeLanguage(lang);
  } catch (err) {
    console.error('Error loading language data:', err);
  }
}

export default i18n;
