import { type ReactNode } from 'react';

type ElementType =
  | 'input'
  | 'date'
  | 'checkbox'
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
}

export interface InputElement extends BaseFormElement {
  type: 'input';
  validation: {
    type: 'text' | 'email' | 'number' | 'custom';
  };
  placeholder: string;
  defaultValue: string;
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
}

export interface CheckboxElement extends BaseFormElement {
  type: 'checkbox';
  options: (string | DisplayValue)[];
  defaultValue: string[];
}

export interface DropboxElement extends BaseFormElement {
  type: 'dropbox';
  options: (string | DisplayValue)[];
  optionsSlot: string;
  defaultValue: string;
}

export interface GridElement extends BaseFormElement {
  type: 'grid';
  data: string[];
  rows: number;
  columns: number;
  displayKeys: DisplayKey[];
  optionsSlot?: string;
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
