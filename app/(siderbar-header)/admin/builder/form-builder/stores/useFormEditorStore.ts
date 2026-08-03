import { create } from 'zustand';

import { createFormElement } from './elementRegistry';
import { useBuilderStore } from '../../store';

import type {
  DisplayValue,
  ElementType,
  ElementTypeItem,
  FormDataJson,
  FormElement,
  FormElementData,
  GridElement,
} from '../type';

import apiClient from '@/lib/api/apiClient';

export const formElementTypes: ElementTypeItem[] = [
  {
    id: '0f27c70d-8d94-4ef8-8ce7-8d160cae7771',
    type_cd: 'input',
    label: 'Text Field',
    default_label: 'New Input',
    visible: true,
    sort_order: 10,
    cre_user_id: 'system',
    cre_dt: '2026-06-01T00:00:00+09:00',
    upd_user_id: 'system',
    upd_dt: '2026-06-01T00:00:00+09:00',
    del_yn: 'N',
  },
  {
    id: '56d6fe48-4537-4f55-a9b8-1a5e6d6f6998',
    type_cd: 'date',
    label: 'Date Field',
    default_label: 'New Date',
    visible: true,
    sort_order: 20,
    cre_user_id: 'system',
    cre_dt: '2026-06-01T00:00:00+09:00',
    upd_user_id: 'system',
    upd_dt: '2026-06-01T00:00:00+09:00',
    del_yn: 'N',
  },
  {
    id: '2a0cf6d5-8e03-421e-a757-8b2e34f2d6df',
    type_cd: 'checkbox',
    label: 'Checkbox',
    default_label: 'New Checkbox',
    visible: true,
    sort_order: 30,
    cre_user_id: 'system',
    cre_dt: '2026-06-01T00:00:00+09:00',
    upd_user_id: 'system',
    upd_dt: '2026-06-01T00:00:00+09:00',
    del_yn: 'N',
  },
  {
    id: 'c8e2603d-a6d8-43ad-927a-2f45c887c0c1',
    type_cd: 'radio',
    label: 'Radio',
    default_label: 'New Radio',
    visible: true,
    sort_order: 35,
    cre_user_id: 'system',
    cre_dt: '2026-06-01T00:00:00+09:00',
    upd_user_id: 'system',
    upd_dt: '2026-06-01T00:00:00+09:00',
    del_yn: 'N',
  },
  {
    id: '75b4f35e-fd2d-4996-84ea-989ab45b8592',
    type_cd: 'dropbox',
    label: 'Dropbox',
    default_label: 'New Dropbox',
    visible: true,
    sort_order: 40,
    cre_user_id: 'system',
    cre_dt: '2026-06-01T00:00:00+09:00',
    upd_user_id: 'system',
    upd_dt: '2026-06-01T00:00:00+09:00',
    del_yn: 'N',
  },
  {
    id: '12999e6e-1855-43f4-aa89-bd2315605d4e',
    type_cd: 'grid',
    label: 'Grid',
    default_label: 'New Grid',
    visible: true,
    sort_order: 50,
    cre_user_id: 'system',
    cre_dt: '2026-06-01T00:00:00+09:00',
    upd_user_id: 'system',
    upd_dt: '2026-06-01T00:00:00+09:00',
    del_yn: 'N',
  },
  {
    id: 'dfa0fa94-b32c-4142-9395-c6d244a34e6f',
    type_cd: 'search',
    label: 'Search',
    default_label: 'New Search',
    visible: true,
    sort_order: 60,
    cre_user_id: 'system',
    cre_dt: '2026-06-01T00:00:00+09:00',
    upd_user_id: 'system',
    upd_dt: '2026-06-01T00:00:00+09:00',
    del_yn: 'N',
  },
];

export type FormEditorState = {
  formId: string | null;
  title: string;
  elements: FormElement[];
  selectedElementId: string | null;

  elementTypes: ElementTypeItem[];
  elementTypesLoading: boolean;
  elementTypesError: string | null;

  formElementTypesJson: ElementTypeItem[];
};

type FormEditorActions = {
  setFormElementTypesJson: (elementTypes: ElementTypeItem[]) => void;
  setFormId: (formId: string | null) => void;
  setTitle: (title: string) => void;
  selectElement: (id: string | null) => void;
  addElement: (elementType: ElementType) => void;
  updateElement: (element: FormElement) => void;
  updateElementField: (id: string, key: string, value: unknown) => void;
  removeElement: (id: string) => void;
  moveElement: (activeId: string, overId: string) => void;
  resizeGrid: (
    element: GridElement,
    key: 'rows' | 'columns',
    value: number,
  ) => void;
  replaceForm: (payload: FormElementData) => void;
  resetForm: () => void;
  saveForm: (formData: FormDataJson) => void;

  loadElementTypes: () => Promise<void>;
};

export type FormEditorStore = FormEditorState & FormEditorActions;

export const initialFormEditorState: FormEditorState = {
  formId: null,
  title: 'new form',
  elements: [],
  selectedElementId: null,

  elementTypes: [],
  elementTypesLoading: false,
  elementTypesError: null,

  formElementTypesJson: formElementTypes,
};

export const useFormEditorStore = create<FormEditorStore>((set, get) => ({
  ...initialFormEditorState,

  setFormElementTypesJson: (elementTypes) =>
    set({ formElementTypesJson: elementTypes }),

  setFormId: (formId) => set({ formId }),

  setTitle: (title) => set({ title }),

  selectElement: (id) => set({ selectedElementId: id }),

  addElement: (elementType) =>
    set((state) => {
      const nextElement = createFormElement(elementType);

      return {
        elements: [...state.elements, nextElement],
        selectedElementId: nextElement.id,
      };
    }),

  updateElement: (nextElement) =>
    set((state) => ({
      elements: state.elements.map((element) =>
        element.id === nextElement.id ? nextElement : element,
      ),
    })),

  updateElementField: (id, key, value) =>
    set((state) => ({
      elements: state.elements.map((element) =>
        element.id === id
          ? ({ ...element, [key]: value } as FormElement)
          : element,
      ),
    })),

  removeElement: (id) =>
    set((state) => ({
      elements: state.elements.filter((element) => element.id !== id),
      selectedElementId:
        state.selectedElementId === id ? null : state.selectedElementId,
    })),

  moveElement: (activeId, overId) =>
    set((state) => {
      const oldIndex = state.elements.findIndex(
        (element) => element.id === activeId,
      );
      const newIndex = state.elements.findIndex(
        (element) => element.id === overId,
      );

      if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
        return state;
      }

      const elements = [...state.elements];
      const [removed] = elements.splice(oldIndex, 1);
      elements.splice(newIndex, 0, removed);

      return { elements };
    }),

  resizeGrid: (element, key, value) =>
    set((state) => {
      const rows = key === 'rows' ? value : element.rows;
      const columns = key === 'columns' ? value : element.columns;

      const data = Array.from(
        { length: rows * columns },
        (_, index) => element.data[index] ?? '',
      );

      return {
        elements: state.elements.map((item) =>
          item.id === element.id
            ? ({
                ...element,
                [key]: value,
                data,
              } as FormElement)
            : item,
        ),
      };
    }),

  replaceForm: ({ formId, title, elements }) =>
    set((state) => ({
      formId: formId === undefined ? state.formId : formId,
      title,
      elements,
      selectedElementId: null,
    })),

  resetForm: () =>
    set({
      formId: null,
      title: 'new form',
      elements: [],
      selectedElementId: null,
    }),

  saveForm: async (formData: FormDataJson) => {
    const payload = {
      form_tl: get().title,
      form_elem: formData,
    };

    // formData에 checkbox, dropbox의 option값에 value와 label데이터가 같을 경우 value값만 저장하도록 변환
    if (payload.form_elem.data.elements) {
      payload.form_elem.data.elements = payload.form_elem.data.elements.map(
        (element) => {
          if (
            (element.type === 'checkbox' ||
              element.type === 'radio' ||
              element.type === 'dropbox') &&
            Array.isArray(element.options)
          ) {
            const normalizedOptions = element.options.map(
              (option: string | DisplayValue) => {
                if (
                  typeof option === 'object' &&
                  'value' in option &&
                  'label' in option &&
                  option.value === option.label
                ) {
                  return option.value;
                }
                return option;
              },
            );
            return {
              ...element,
              options: normalizedOptions,
            };
          }
          return element;
        },
      );
    }

    // console.log('Saving form with payload:', payload);
    let url: string;
    let res: any;
    try {
      if (get().formId) {
        url = `/chat/forms/${get().formId}`;
        res = await apiClient.put(url.replace(/\s/g, ''), payload);
      } else {
        url = `/chat/forms`;
        res = await apiClient.post(url.replace(/\s/g, ''), payload);
      }
      get().setFormId(res.data.form_id);
    } catch (error) {
      console.error('Error saving form:', error);
      throw error;
    }
  },

  loadElementTypes: async () => {
    const { loadingUserData } = useBuilderStore.getState() as any;
    set({
      elementTypesLoading: true,
      elementTypesError: null,
    });

    try {
      const userInfo = await loadingUserData();
      // TODO: 추후 API 전환
      // const res = await apiClient.get<ElementTypeItem[]>('/chat/form-element-types');
      // const elementTypes = res.data;
      const elementTypes = get().formElementTypesJson as ElementTypeItem[];

      set({
        elementTypes: elementTypes
          .filter(
            (item) =>
              item.visible &&
              item.del_yn !== 'Y' &&
              !userInfo.unuse_form_elements.includes(item.type_cd),
          )
          .sort((a, b) => a.sort_order - b.sort_order),
        elementTypesLoading: false,
      });
    } catch (error) {
      set({
        elementTypes: [],
        elementTypesLoading: false,
        elementTypesError:
          error instanceof Error
            ? error.message
            : 'Failed to load element types',
      });
    }
  },
}));

type UserInfo = {
  id: string;
  user_id: string;
  user_name: string;
  unuse_form_elements: string[];
  unuse_nodes: string[];
};
