import { Timestamp } from 'next/dist/server/lib/cache-handlers/types';
import { type ReactNode } from 'react';
import { LOCALE_TIME, LOCALE_TIME_TYPE } from '../../types/types';

type ElementType =
  | 'input'
  | 'date'
  | 'checkbox'
  | 'radio'
  | 'dropbox'
  | 'grid'
  | 'search';

export interface ElementTypeItem {
  id: string;
  type_cd: ElementType;
  label: string;
  default_label: string;
  visible: boolean;
  sort_order: number;
  cre_user_id: string;
  cre_dt: string;
  upd_user_id: string;
  upd_dt: string;
  del_yn: 'Y' | 'N';
}

type FormElement =
  | InputElement
  | DateElement
  | CheckboxElement
  | RadioElement
  | DropboxElement
  | GridElement
  | SearchElement;

export interface ComponentType {
  type: ElementType;
  label: string;
  defaultLabel: string;
  icon: ReactNode;
}

export interface DisplayKey {
  key: string;
  label: string;
}

export interface DisplayValue {
  value: string;
  label: string;
}

export interface BaseFormElement {
  id: string;
  name: string;
  type: ElementType;
  label: string;
  apiId?: string;
  apiData?: Record<string, unknown> | null;
  eventType?: 'onChange' | 'onClick' | '';
  parameterId?: string;
  optionalParameter?: string;
  targetElementId?: string;
  responsePath?: string;

  requires?: boolean;
  description?: string;
}

export interface InputElement extends BaseFormElement {
  type: 'input';
  validation: {
    type: 'text' | 'email' | 'number' | 'custom';
  };
  regex?: string;
  placeholder: string;
  defaultValue: string;

  minLength?: string;
  maxLength?: string;
  transformTextType?: 'uppercase' | 'lowercase' | 'capitalize' | '';
}

export interface SearchElement extends BaseFormElement {
  type: 'search';
  placeholder: string;
  defaultValue: string;
  apiConfig: {
    url: string;
    method: string;
    headers: string;
    bodyTemplate: string;
  };
  resultSlot: string;
  inputFillKey: string | null;
}

export interface DateElement extends BaseFormElement {
  type: 'date';
  defaultValue: string;
  value: LOCALE_TIME_TYPE;

  locale: LOCALE_TIME;
  dateValue: string;
  fromValue?: LOCALE_TIME_TYPE;
  toValue?: LOCALE_TIME_TYPE;
  hasFromTo?: boolean;
  defaultFromValue?: string;
  defaultToValue?: string;
  fromDateValue: string;
  toDateValue: string;
  defaultToDateOffset?: number;
  hasTime: boolean;
  timeValue: string;
  defaultTimeValue: string;
  defaultFromTimeValue?: string;
  defaultToTimeValue?: string;
  fromTimeValue: string;
  toTimeValue: string;
}

export interface CheckboxElement extends BaseFormElement {
  type: 'checkbox';
  options: (string | DisplayValue)[];
  defaultValue: string[];
}

export interface RadioElement extends BaseFormElement {
  type: 'radio';
  options: (string | DisplayValue)[];
  defaultValue: string;
}

export interface DropboxElement extends BaseFormElement {
  type: 'dropbox';
  options: (string | DisplayValue)[];
  optionsSlot: string;
  selectKind: 'single' | 'multi';
  defaultValue: string | string[];
}

export interface GridElement extends BaseFormElement {
  type: 'grid';
  data: string[];
  rows: number;
  columns: number;
  displayKeys: DisplayKey[];
  optionsSlot?: string;
  selectable?: boolean;
  hasHeader?: boolean;
}
export interface FormElementData {
  formId?: string | null;
  id: string;
  title: string;
  elements: FormElement[];
  dataSource?: string;
  dataSourceType?: 'json' | 'api';
  enableExcelUpload?: boolean;
}

export interface FormDataJson {
  id: string | null;
  data: FormElementData;
  type: 'form';
  width: number;
  height: number;
  dragging: boolean;
  selected: boolean;
}

export interface SavedFormContent {
  form_id: string;
  form_tl: string;
  cre_usr_id: string;
  cre_dt: string;
  upd_usr_id: string;
  upd_dt: string;
  form_elem: FormDataJson | Partial<FormDataJson>;
}

export type { FormElement, ElementType };


// nxApi
interface NxApisRes {
  api_des: string;
  api_dsp_seq: string;
  api_endpt_addrs: string;
  api_intt_id: string;
  intt_ti_cntn: string;
  api_meth_but_id: string;
  api_meth_but_nm: string;
  api_pgm_nr: string;
  api_pgm_nm: string;
  api_dto_nm: string;
  api_dto_id: string;
  total_rows: number;
}

type NxMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

interface NxApis {
  id: string;
  endPoint: string;
  method?: NxMethod;
  headers?: string;
  intentId?: string;
  intentTil?: string;
  buttonId?: string;
  description: string;
  buttonName?: string;
  uiID?: string;
  uiName?: string;
  dto?: string;
  dtoId?: string;
  useYn?: string;
  totalRows: number;
}

export type { NxApisRes, NxApis, NxMethod };
