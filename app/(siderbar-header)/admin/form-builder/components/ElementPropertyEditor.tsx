import { useState } from 'react';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

import {
  DisplayKey,
  DisplayValue,
  FormElement,
  GridElement,
  InputElement,
} from '../type';
import GridDataEditor from './GridDataEditor';

const splitList = (value: string) =>
  value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const formatList = (items: string[]) => items.join('\n');

const parseDisplayValues = (value: string): DisplayValue[] =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [value, ...labelParts] = line.split(':');
      const label = labelParts.join(':').trim();
      return {
        value: value.trim(),
        label: label || value.trim(),
      };
    })
    .filter((item) => item.value);

type DisplayOption = string | DisplayValue;

const normalizeDisplayValue = (
  option: DisplayOption,
  index: number,
): DisplayValue => {
  if (typeof option === 'string') {
    return {
      value: option,
      label: option,
    };
  }

  const value = option.value || `Option ${index + 1}`;

  return {
    value,
    label: option.label || value,
  };
};

const formatDisplayValues = (displayValues: DisplayOption[]) =>
  displayValues
    .map((item, index) => {
      const option = normalizeDisplayValue(item, index);
      return `${option.value}:${option.label}`;
    })
    .join('\n');

const getOptionValues = (options: DisplayOption[]) =>
  options.map((option, index) => normalizeDisplayValue(option, index).value);

const parseDisplayKeys = (value: string): DisplayKey[] =>
  value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [key, ...labelParts] = line.split(':');
      const label = labelParts.join(':').trim();
      return {
        key: key.trim(),
        label: label || key.trim(),
      };
    })
    .filter((item) => item.key);

const formatDisplayKeys = (displayKeys: DisplayKey[]) =>
  displayKeys.map((item) => `${item.key}:${item.label}`).join('\n');

function DraftTextField({
  label,
  helperText,
  minRows,
  value,
  onCommit,
  hidden = false,
  isReadonly = false,
}: {
  label: string;
  helperText: string;
  minRows: number;
  value: string;
  onCommit: (value: string) => void;
  hidden?: boolean;
  isReadonly?: boolean;
}) {
  const [draft, setDraft] = useState(value);
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setDraft(value);
    setPrevValue(value);
  }

  if (hidden) return null;

  return (
    <TextField
      label={label}
      helperText={helperText}
      size="small"
      fullWidth
      multiline
      minRows={minRows}
      disabled={isReadonly}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => onCommit(draft)}
      onKeyDown={(event) => event.stopPropagation()}
    />
  );
}

function ElementPropertyEditor({
  element,
  onChange,
  onGridSizeChange,
  isReadonly = false,
}: {
  element: FormElement;
  onChange: (element: FormElement) => void;
  onGridSizeChange: (
    element: GridElement,
    key: 'rows' | 'columns',
    value: number,
  ) => void;
  isReadonly?: boolean;
}) {
  switch (element.type) {
    case 'input':
      return (
        <Stack spacing={2}>
          <TextField
            label="Default Value"
            size="small"
            fullWidth
            disabled={isReadonly}
            value={element.defaultValue}
            onChange={(event) =>
              onChange({ ...element, defaultValue: event.target.value })
            }
          />
          <Typography variant="caption" color="text.secondary">
            Use {'{slotName}'} to reference a slot value, otherwise treated as
            literal text.
          </Typography>
          <TextField
            label="Placeholder"
            size="small"
            fullWidth
            disabled={isReadonly}
            value={element.placeholder}
            onChange={(event) =>
              onChange({ ...element, placeholder: event.target.value })
            }
          />
          <FormControl fullWidth size="small">
            <InputLabel id="validation-label">validation</InputLabel>
            <Select
              labelId="validation-label"
              label="validation"
              disabled={isReadonly}
              value={element.validation.type}
              onChange={(event) =>
                onChange({
                  ...element,
                  validation: {
                    type: event.target
                      .value as InputElement['validation']['type'],
                  },
                })
              }
            >
              <MenuItem value="text">text</MenuItem>
              <MenuItem value="email">email</MenuItem>
              <MenuItem value="number">number</MenuItem>
              <MenuItem value="custom">custom</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      );
    case 'date':
      return (
        <Stack spacing={2}>
          <TextField
            label="Default Value"
            size="small"
            fullWidth
            type="date"
            disabled={isReadonly}
            value={element.defaultValue}
            onChange={(event) =>
              onChange({ ...element, defaultValue: event.target.value })
            }
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
      );
    case 'checkbox':
      return (
        <Stack spacing={2}>
          <DraftTextField
            label="Options"
            helperText="value:label 형식으로 줄바꿈 입력"
            minRows={3}
            isReadonly={isReadonly}
            value={formatDisplayValues(element.options)}
            onCommit={(value) => {
              const options = parseDisplayValues(value);
              const optionValues = options.map((option) => option.value);
              onChange({
                ...element,
                options,
                defaultValue: element.defaultValue.filter((item) =>
                  optionValues.includes(item),
                ),
              });
            }}
          />
          <DraftTextField
            label="Default Value"
            helperText="체크할 옵션 값을 콤마 또는 줄바꿈으로 입력"
            minRows={2}
            isReadonly={isReadonly}
            value={formatList(element.defaultValue)}
            onCommit={(value) =>
              onChange({
                ...element,
                defaultValue: splitList(value).filter((item) =>
                  getOptionValues(element.options).includes(item),
                ),
              })
            }
          />
        </Stack>
      );
    case 'dropbox':
      return (
        <Stack spacing={2}>
          <DraftTextField
            label="Options"
            helperText="value:label 형식으로 줄바꿈 입력"
            minRows={3}
            isReadonly={isReadonly}
            value={formatDisplayValues(element.options)}
            onCommit={(value) => {
              const options = parseDisplayValues(value);
              const optionValues = options.map((option) => option.value);
              onChange({
                ...element,
                options,
                defaultValue: optionValues.includes(element.defaultValue)
                  ? element.defaultValue
                  : '',
              });
            }}
          />
          <TextField
            label="Options Slot"
            size="small"
            fullWidth
            disabled={isReadonly}
            value={element.optionsSlot}
            onChange={(event) =>
              onChange({ ...element, optionsSlot: event.target.value })
            }
          />
          <FormControl fullWidth size="small">
            <InputLabel id="dropbox-default-label">Default Value</InputLabel>
            <Select
              labelId="dropbox-default-label"
              label="Default Value"
              disabled={isReadonly}
              value={element.defaultValue}
              onChange={(event) =>
                onChange({ ...element, defaultValue: event.target.value })
              }
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {element.options.map((item, index) => {
                const option = normalizeDisplayValue(item, index);

                return (
                  <MenuItem key={option.value || index} value={option.value}>
                    {option.label}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
        </Stack>
      );
    case 'search':
      return (
        <Stack spacing={2}>
          <TextField
            label="Default Value"
            size="small"
            fullWidth
            disabled={isReadonly}
            value={element.defaultValue}
            onChange={(event) =>
              onChange({ ...element, defaultValue: event.target.value })
            }
          />
          <TextField
            label="Placeholder"
            size="small"
            fullWidth
            disabled={isReadonly}
            value={element.placeholder}
            onChange={(event) =>
              onChange({ ...element, placeholder: event.target.value })
            }
          />
          <TextField
            label="API URL"
            size="small"
            fullWidth
            disabled={isReadonly}
            value={element.apiConfig.url}
            onChange={(event) =>
              onChange({
                ...element,
                apiConfig: {
                  ...element.apiConfig,
                  url: event.target.value,
                },
              })
            }
          />
          <FormControl fullWidth size="small">
            <InputLabel id="search-method-label">Method</InputLabel>
            <Select
              labelId="search-method-label"
              label="Method"
              disabled={isReadonly}
              value={element.apiConfig.method}
              onChange={(event) =>
                onChange({
                  ...element,
                  apiConfig: {
                    ...element.apiConfig,
                    method: event.target.value,
                  },
                })
              }
            >
              <MenuItem value="GET">GET</MenuItem>
              <MenuItem value="POST">POST</MenuItem>
            </Select>
          </FormControl>
          <DraftTextField
            label="Headers"
            helperText="Use {{slotName}} for dynamic values in JSON header strings."
            minRows={3}
            isReadonly={isReadonly}
            value={element.apiConfig.headers}
            onCommit={(value) =>
              onChange({
                ...element,
                apiConfig: {
                  ...element.apiConfig,
                  headers: value,
                },
              })
            }
          />
          <DraftTextField
            label="Body Template"
            helperText="Use {{value}} to insert the search term. You can also use other slots like {{slotName}}."
            minRows={4}
            isReadonly={isReadonly}
            value={element.apiConfig.bodyTemplate}
            onCommit={(value) =>
              onChange({
                ...element,
                apiConfig: {
                  ...element.apiConfig,
                  bodyTemplate: value,
                },
              })
            }
          />
          <TextField
            label="Input Fill Key"
            helperText="Key from the selected grid row to fill the search input field. (Defaults to the first column if empty)"
            size="small"
            fullWidth
            disabled={isReadonly}
            value={element.inputFillKey ?? ''}
            onChange={(event) =>
              onChange({
                ...element,
                inputFillKey: event.target.value.trim()
                  ? event.target.value
                  : null,
              })
            }
          />
          <TextField
            label="Result Slot"
            helperText="The API response data will be stored in this slot. A Grid element can use this slot in its 'Data Slot' field."
            size="small"
            fullWidth
            disabled={isReadonly}
            value={element.resultSlot}
            onChange={(event) =>
              onChange({ ...element, resultSlot: event.target.value })
            }
          />
        </Stack>
      );
    case 'grid':
      return (
        <Stack spacing={2}>
          <TextField
            label="Data Slot"
            helperText="Bind to array in slot"
            size="small"
            fullWidth
            disabled={isReadonly}
            value={element.optionsSlot ?? ''}
            onChange={(event) =>
              onChange({ ...element, optionsSlot: event.target.value })
            }
          />
          {(element.optionsSlot ?? '').trim() ? (
            <DraftTextField
              label="Display Labels"
              helperText="key:label 형식으로 줄바꿈 입력"
              minRows={3}
              isReadonly={isReadonly}
              value={formatDisplayKeys(element.displayKeys)}
              onCommit={(value) =>
                onChange({
                  ...element,
                  displayKeys: parseDisplayKeys(value),
                })
              }
            />
          ) : (
            <>
              <Stack direction="row" spacing={1}>
                <TextField
                  label="Rows"
                  size="small"
                  fullWidth
                  type="number"
                  disabled={isReadonly}
                  value={element.rows}
                  inputProps={{ min: 1, max: 20 }}
                  onChange={(event) =>
                    onGridSizeChange(
                      element,
                      'rows',
                      Math.max(1, Number(event.target.value) || 1),
                    )
                  }
                />
                <TextField
                  label="Columns"
                  size="small"
                  fullWidth
                  type="number"
                  disabled={isReadonly}
                  value={element.columns}
                  inputProps={{ min: 1, max: 20 }}
                  onChange={(event) =>
                    onGridSizeChange(
                      element,
                      'columns',
                      Math.max(1, Number(event.target.value) || 1),
                    )
                  }
                />
              </Stack>
              <GridDataEditor
                element={element}
                onChange={(data) => onChange({ ...element, data })}
                isReadonly={isReadonly}
              />
              <DraftTextField
                hidden
                label="Data"
                helperText="각 셀 값을 콤마 또는 줄바꿈으로 입력"
                minRows={3}
                isReadonly={isReadonly}
                value={formatList(element.data)}
                onCommit={(value) =>
                  onChange({
                    ...element,
                    data: Array.from(
                      { length: element.rows * element.columns },
                      (_, index) => splitList(value)[index] ?? '',
                    ),
                  })
                }
              />
            </>
          )}
          <DraftTextField
            hidden
            label="Display Labels"
            helperText="key:label 형식으로 줄바꿈 입력"
            minRows={3}
            isReadonly={isReadonly}
            value={formatDisplayKeys(element.displayKeys)}
            onCommit={(value) =>
              onChange({
                ...element,
                displayKeys: parseDisplayKeys(value),
              })
            }
          />
        </Stack>
      );
    default:
      return null;
  }
}

export default ElementPropertyEditor;
