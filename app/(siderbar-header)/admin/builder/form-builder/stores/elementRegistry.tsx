import {
  TextFields as TypeIcon,
  CheckBox as CheckSquareIcon,
  RadioButtonChecked as RadioIcon,
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
      apiId: '',
      apiData: null,
      eventType: '',
      parameterId: '',
      optionalParameter: '',
      targetElementId: '',
      responsePath: '',
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
      apiId: '',
      apiData: null,
      eventType: '',
      parameterId: '',
      optionalParameter: '',
      targetElementId: '',
      responsePath: '',
      defaultValue: '',
      locale: 'ko',
      value: { date: 0, locale: 'ko' },
      dateValue: '',
      hasFromTo: false,
      defaultToDateOffset: 0,
      defaultFromValue: '',
      defaultToValue: '',
      fromDateValue: '',
      toDateValue: '',
      hasTime: false,
      timeValue: '',
      defaultTimeValue: '',
      defaultFromTimeValue: '',
      defaultToTimeValue: '',
      fromTimeValue: '',
      toTimeValue: '',
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
      apiId: '',
      apiData: null,
      eventType: '',
      parameterId: '',
      optionalParameter: '',
      targetElementId: '',
      responsePath: '',
      options: [
        { value: 'Option 1', label: 'Option 1' },
        { value: 'Option 2', label: 'Option 2' },
      ],
      defaultValue: [],
    }),
  },

  radio: {
    label: 'Radio',
    defaultLabel: 'New Radio',
    icon: <RadioIcon fontSize="small" />,
    create: (): FormElement => ({
      id: createId('radio'),
      type: 'radio',
      name: '',
      label: 'New Radio',
      apiId: '',
      apiData: null,
      eventType: '',
      parameterId: '',
      optionalParameter: '',
      targetElementId: '',
      responsePath: '',
      options: [
        { value: 'Option 1', label: 'Option 1' },
        { value: 'Option 2', label: 'Option 2' },
      ],
      defaultValue: '',
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
      apiId: '',
      apiData: null,
      eventType: '',
      parameterId: '',
      optionalParameter: '',
      targetElementId: '',
      responsePath: '',
      options: [
        { value: 'Option 1', label: 'Option 1' },
        { value: 'Option 2', label: 'Option 2' },
      ],
      optionsSlot: '',
      selectKind: 'single',
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
      apiId: '',
      apiData: null,
      eventType: '',
      parameterId: '',
      optionalParameter: '',
      targetElementId: '',
      responsePath: '',
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
      apiId: '',
      apiData: null,
      eventType: '',
      parameterId: '',
      optionalParameter: '',
      targetElementId: '',
      responsePath: '',
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
