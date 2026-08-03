interface GetLanguage {
  ten_id: string;
  stg_id: string;
  lang: string;
  lang_nm: string;
  use_yn: string | null;
  cre_usr_id: string | null;
  cre_dt: Date | null;
  lcl_cre_dt: Date | null;
  upd_usr_id: string | null;
  upd_dt: Date | null;
  lcl_upd_dt: Date | null;
  del_yn: string | null;
}

interface SaveLanguage {
  ten_id: string;
  stg_id: string;
  lang: string;
  lang_nm: string;
}

interface LanguageRes {
  ids?: Array<string | number>;
  lang: string;
  lang_nm: string;
  use_yn?: string;
  cre_dt?: string;
  upd_dt?: string;
  flag?: string;
  delYn?: string;
}

interface TranslationRes {
  lang: string;
  key_name: string;
  value?: string;
  cre_dt?: string;
  upd_dt?: string;
  use_yn?: string;
  flag?: string;
  delYn?: string;
}
interface FilterState {
  language: string;
  search: string;
}

interface Option {
  label: string;
  value: string;
  code?: string;
}

interface TranslationDetail {
  key_name: string;
  lang: string;
  value: string;
}

interface TranslationMaster {
  key_nm: string;
  lang_nm: string;
  upd_dt: string;
}

interface TranslationItem {
  mst: TranslationMaster;
  dtl: TranslationDetail[];
}

interface PaginatedTranslationRes {
  total: number;
  datas: TranslationItem[];
}

export type {
  GetLanguage,
  SaveLanguage,
  LanguageRes,
  TranslationRes,
  FilterState,
  Option,
  TranslationDetail,
  TranslationMaster,
  TranslationItem,
  PaginatedTranslationRes,
};
