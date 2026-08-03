// import apiClient from '../apiClient';

import {
  GetLanguage,
  SaveLanguage,
  LanguageRes,
  TranslationRes,
  PaginatedTranslationRes,
} from '@/lib/types/language';

const API_PREFIX_LANG = '/languages';
const API_PREFIX_TRANSLATION = 'translations';

//language 항목을 가져오는 함수
const getLanguage = async (use_yn: string): Promise<GetLanguage[]> => {
  const requestParams = new URLSearchParams({
    use_yn: use_yn,
  });

  // return apiClient.get(API_PREFIX_LANG, {
  //   params: requestParams,
  // });
  return null as any
};

/* -------------------- Language APIs -------------------- */
const getLanguages = async (): Promise<LanguageRes[]> => {
  // return apiClient.get(API_PREFIX_LANG);
  return null as any
};

const saveLanguages = async (data: LanguageRes[]): Promise<void> => {
  // return apiClient.post(`${API_PREFIX_LANG}/save`, data);
  return null as any
};

const deleteLanguage = async (data: string[]): Promise<void> => {
  // return apiClient.post(`${API_PREFIX_LANG}/delete`, data);
  return null as any
};

const toggleActiveLanguage = async (lang: string): Promise<void> => {
  // return apiClient.post(`${API_PREFIX_LANG}/active/${lang}`);
  return null as any
};

//language 항목 저장 함수
// const saveLanguage = async (data: SaveLanguage[]): Promise<void> => {
//   return apiClient.get(API_PREFIX_LANG + '/save', data);
// };

//language 항목 삭제 함수
// const deleteLanguage = async (data: string[]): Promise<void> => {
//   return apiClient.get(API_PREFIX_LANG + '/delete', data);
// };

//language 항목 active 여부 변경 함수
// const activeLanguage = async (languageCode: string): Promise<void> => {
//   return apiClient.get(API_PREFIX_LANG + '/active/' + languageCode);
// };

/* -------------------- Translation APIs -------------------- */

const getTranslations = async (
  lang: string | null = null,
  value: string | null = null,
  skip: number,
  limit: number,
): Promise<PaginatedTranslationRes> => {
  // return apiClient.get(`${API_PREFIX_LANG}/get-info`, {
  //   params: {
  //     lang: lang,
  //     value: value,
  //     skip: skip,
  //     limit: limit,
  //   },
  // });
  return null as any
};

const getTranslationByKey = async (
  key_name: string,
): Promise<TranslationRes[]> => {
  // return apiClient.get(`${API_PREFIX_TRANSLATION}/${key_name}`);
  return null as any
};

const checkTranslationKey = async (key_name: string): Promise<boolean> => {
  // return apiClient.get(`${API_PREFIX_TRANSLATION}/check/${key_name}`);
  return null as any
};

const saveTranslations = async (data: TranslationRes[]): Promise<void> => {
  // return apiClient.post(`${API_PREFIX_TRANSLATION}/save`, data);
  return null as any
};

const deleteTranslations = async (data: string[]): Promise<void> => {
  // return apiClient.post(`${API_PREFIX_TRANSLATION}/delete`, data);
  return null as any
};

const getLocales = async (lang: string): Promise<Record<string, string>> => {
  // return apiClient.get(`${API_PREFIX_TRANSLATION}/locales/${lang}`);
  return null as any
};

//language 항목 active 여부 변경 함수
const getMultiLang = async (lang: string): Promise<void> => {
  // return apiClient.get('/translations/locales/' + lang);
  return null as any
};

export const languageService = {
  getLanguage: getLanguage,
  // saveLanguage: saveLanguage,
  // deleteLanguage: deleteLanguage,
  // activeLanguage: activeLanguage,
  getMultiLang: getMultiLang,
  getLanguages,
  saveLanguages,
  deleteLanguage,
  toggleActiveLanguage,
  getTranslations,
  getTranslationByKey,
  checkTranslationKey,
  saveTranslations,
  deleteTranslations,
  getLocales,
};
