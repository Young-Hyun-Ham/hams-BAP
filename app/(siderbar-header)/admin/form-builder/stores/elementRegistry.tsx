import {
  TextFields as TypeIcon,
  CheckBox as CheckSquareIcon,
  ArrowDropDown as ChevronDownIcon,
  DateRange as DateIcon,
  GridView as GridIcon,
  Search as ScearchIcon,
} from '@mui/icons-material';

import type { ElementType, FormElement } from '../type';

const createId = (type: ElementType) =>
  `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const FORM_ELEMENT_REGISTRY = {
  input: {
    label: 'Text Field',
    defaultLabel: 'New Input',
    icon: <TypeIcon fontSize="small" />,
    create: (): FormElement => ({
      id: createId('input'),
      type: 'input',
      name: '',
      label: 'New Input',
      validation: { type: 'text' },
      placeholder: '',
      defaultValue: '',
    }),
  },

  date: {
    label: 'Date Field',
    defaultLabel: 'New Date',
    icon: <DateIcon fontSize="small" />,
    create: (): FormElement => ({
      id: createId('date'),
      type: 'date',
      name: '',
      label: 'New Date',
      defaultValue: '',
    }),
  },

  checkbox: {
    label: 'Checkbox',
    defaultLabel: 'New Checkbox',
    icon: <CheckSquareIcon fontSize="small" />,
    create: (): FormElement => ({
      id: createId('checkbox'),
      type: 'checkbox',
      name: '',
      label: 'New Checkbox',
      options: [
        { value: 'Option 1', label: 'Option 1' },
        { value: 'Option 2', label: 'Option 2' },
      ],
      defaultValue: [],
    }),
  },

  dropbox: {
    label: 'Dropbox',
    defaultLabel: 'New Dropbox',
    icon: <ChevronDownIcon fontSize="small" />,
    create: (): FormElement => ({
      id: createId('dropbox'),
      type: 'dropbox',
      name: '',
      label: 'New Dropbox',
      options: [
        { value: 'Option 1', label: 'Option 1' },
        { value: 'Option 2', label: 'Option 2' },
      ],
      optionsSlot: '',
      defaultValue: '',
    }),
  },

  grid: {
    label: 'Grid',
    defaultLabel: 'New Grid',
    icon: <GridIcon fontSize="small" />,
    create: (): FormElement => ({
      id: createId('grid'),
      type: 'grid',
      name: '',
      label: 'New Grid',
      data: ['', '', '', ''],
      rows: 2,
      columns: 2,
      displayKeys: [],
      optionsSlot: '',
    }),
  },

  search: {
    label: 'Search',
    defaultLabel: 'New Search',
    icon: <ScearchIcon fontSize="small" />,
    create: (): FormElement => ({
      id: createId('search'),
      type: 'search',
      name: 'search_term',
      label: 'New Search',
      placeholder: 'Enter search term...',
      defaultValue: '',
      apiConfig: {
        url: 'https://',
        method: 'POST',
        headers: '{}',
        bodyTemplate: '{"query": "{{value}}"}',
      },
      resultSlot: 'search_results',
      inputFillKey: null,
    }),
  },
} as const;

export const FORM_ELEMENT_TYPES = Object.keys(
  FORM_ELEMENT_REGISTRY,
) as ElementType[];

export const createFormElement = (type: ElementType): FormElement => {
  return FORM_ELEMENT_REGISTRY[type].create();
};
