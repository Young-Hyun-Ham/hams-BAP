import { useState } from 'react';
import {
  Box,
  Checkbox,
  Chip,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

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

const getOptionValues = (options: DisplayOption[]) =>
  options.map((option, index) => normalizeDisplayValue(option, index).value);

const createDefaultOption = (index: number): DisplayValue => ({
  value: `Option ${index + 1}`,
  label: `Option ${index + 1}`,
});

const getDropboxDefaultValue = (value: string | string[]) =>
  Array.isArray(value) ? (value[0] ?? '') : value;

const getDropboxDefaultValues = (value: string | string[]) =>
  Array.isArray(value) ? value : value ? [value] : [];

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

function DisplayOptionsEditor({
  options,
  onOptionsChange,
  isReadonly,
}: {
  options: DisplayOption[];
  onOptionsChange: (options: DisplayValue[]) => void;
  isReadonly: boolean;
}) {
  const { t } = useTranslation();
  const normalizedOptions = options.map(normalizeDisplayValue);
  const countOptions = Array.from({ length: 21 }, (_, index) => index);

  const handleCountChange = (count: number) => {
    const nextOptions = Array.from({ length: count }, (_, index) => {
      const currentOption = normalizedOptions[index];

      return currentOption ?? createDefaultOption(index);
    });

    onOptionsChange(nextOptions);
  };

  const handleOptionChange = (
    index: number,
    key: keyof DisplayValue,
    value: string,
  ) => {
    const nextOptions = normalizedOptions.map((option, optionIndex) =>
      optionIndex === index ? { ...option, [key]: value } : option,
    );

    onOptionsChange(nextOptions);
  };

  return (
    <Stack spacing={1.25}>
      <FormControl fullWidth size="small">
        <InputLabel id="checkbox-options-count-label">{t('Count')}</InputLabel>
        <Select
          labelId="checkbox-options-count-label"
          label={t('Count')}
          disabled={isReadonly}
          value={normalizedOptions.length}
          onChange={(event) => handleCountChange(Number(event.target.value))}
        >
          {countOptions.map((count) => (
            <MenuItem key={count} value={count}>
              {count}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '32px minmax(0, 1fr) 72px',
          gap: 0.75,
          alignItems: 'center',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          No
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Display
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Value
        </Typography>

        {normalizedOptions.map((option, index) => (
          <Box key={index} sx={{ display: 'contents' }}>
            <TextField
              size="small"
              value={index + 1}
              disabled
              inputProps={{
                sx: {
                  textAlign: 'center',
                  px: 0.5,
                },
              }}
            />
            <TextField
              size="small"
              disabled={isReadonly}
              value={option.label}
              onChange={(event) =>
                handleOptionChange(index, 'label', event.target.value)
              }
            />
            <TextField
              size="small"
              disabled={isReadonly}
              value={option.value}
              onChange={(event) =>
                handleOptionChange(index, 'value', event.target.value)
              }
            />
          </Box>
        ))}
      </Box>
    </Stack>
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
  const { t } = useTranslation();

  switch (element.type) {
    case 'input':
      return (
        <Stack spacing={2}>
          <TextField
            label={t('Default Value')}
            size="small"
            fullWidth
            disabled={isReadonly}
            value={element.defaultValue}
            onChange={(event) =>
              onChange({ ...element, defaultValue: event.target.value })
            }
          />
          <Typography variant="caption" color="text.secondary">
            {t(
              `Use {slotName} to reference a slot value, otherwise treated as literal text.`,
            )}
          </Typography>
          <TextField
            label={t('Placeholder')}
            size="small"
            fullWidth
            disabled={isReadonly}
            value={element.placeholder}
            onChange={(event) =>
              onChange({ ...element, placeholder: event.target.value })
            }
          />
          <FormControl fullWidth size="small">
            <InputLabel id="validation-label">{t('validation')}</InputLabel>
            <Select
              labelId="validation-label"
              label={t('validation')}
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
              <MenuItem value="text">{t('text')}</MenuItem>
              <MenuItem value="email">{t('email')}</MenuItem>
              <MenuItem value="number">{t('number')}</MenuItem>
              <MenuItem value="custom">{t('custom')}</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      );
    case 'date':
      return (
        <Stack spacing={2}>
          <TextField
            label={t('Default Value')}
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
          <DisplayOptionsEditor
            options={element.options}
            onOptionsChange={(options) => {
              const optionValues = options.map((option) => option.value);
              onChange({
                ...element,
                options,
                defaultValue: element.defaultValue.filter((item) =>
                  optionValues.includes(item),
                ),
              });
            }}
            isReadonly={isReadonly}
          />
          <DraftTextField
            label={t('Default Value')}
            helperText={t(
              'Enter the value of the option to check in comma or line-up',
            )}
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
    case 'radio': {
      const normalizedOptions = element.options.map(normalizeDisplayValue);

      return (
        <Stack spacing={2}>
          <DisplayOptionsEditor
            options={element.options}
            onOptionsChange={(options) => {
              const optionValues = options.map((option) => option.value);
              onChange({
                ...element,
                options,
                defaultValue: optionValues.includes(element.defaultValue)
                  ? element.defaultValue
                  : '',
              });
            }}
            isReadonly={isReadonly}
          />
          <FormControl fullWidth size="small">
            <InputLabel id="radio-default-label">
              {t('Default Value')}
            </InputLabel>
            <Select
              labelId="radio-default-label"
              label={t('Default Value')}
              disabled={isReadonly}
              value={element.defaultValue}
              onChange={(event) =>
                onChange({ ...element, defaultValue: event.target.value })
              }
            >
              <MenuItem value="">
                <em>{t('None')}</em>
              </MenuItem>
              {normalizedOptions.map((option, index) => (
                <MenuItem key={option.value || index} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      );
    }
    case 'dropbox': {
      const isMultiSelect = element.selectKind === 'multi';
      const normalizedOptions = element.options.map(normalizeDisplayValue);
      const optionLabels = new Map(
        normalizedOptions.map((option) => [option.value, option.label]),
      );

      return (
        <Stack spacing={2}>
          <FormControl fullWidth size="small">
            <InputLabel id="dropbox-select-kind-label">
              {t('Select Kind')}
            </InputLabel>
            <Select
              labelId="dropbox-select-kind-label"
              label={t('Select Kind')}
              disabled={isReadonly}
              value={element.selectKind}
              onChange={(event) => {
                const selectKind = event.target.value as 'single' | 'multi';

                onChange({
                  ...element,
                  selectKind,
                  defaultValue:
                    selectKind === 'multi'
                      ? getDropboxDefaultValues(element.defaultValue)
                      : getDropboxDefaultValue(element.defaultValue),
                });
              }}
            >
              <MenuItem value="single">{t('single select')}</MenuItem>
              <MenuItem value="multi">{t('multi select')}</MenuItem>
            </Select>
          </FormControl>
          <DisplayOptionsEditor
            options={element.options}
            onOptionsChange={(options) => {
              const optionValues = options.map((option) => option.value);
              onChange({
                ...element,
                options,
                defaultValue: isMultiSelect
                  ? getDropboxDefaultValues(element.defaultValue).filter(
                      (item) => optionValues.includes(item),
                    )
                  : optionValues.includes(
                        getDropboxDefaultValue(element.defaultValue),
                      )
                    ? getDropboxDefaultValue(element.defaultValue)
                    : '',
              });
            }}
            isReadonly={isReadonly}
          />
          <TextField
            label={t('Options Slot')}
            size="small"
            fullWidth
            disabled={isReadonly}
            value={element.optionsSlot}
            onChange={(event) =>
              onChange({ ...element, optionsSlot: event.target.value })
            }
          />
          <FormControl fullWidth size="small">
            <InputLabel id="dropbox-default-label">
              {t('Default Value')}
            </InputLabel>
            <Select
              labelId="dropbox-default-label"
              label={t('Default Value')}
              disabled={isReadonly}
              multiple={isMultiSelect}
              value={
                isMultiSelect
                  ? getDropboxDefaultValues(element.defaultValue)
                  : getDropboxDefaultValue(element.defaultValue)
              }
              renderValue={(selected) => {
                const selectedValues = Array.isArray(selected)
                  ? selected
                  : selected
                    ? [String(selected)]
                    : [];

                if (!selectedValues.length) return <em>{t('None')}</em>;

                if (!isMultiSelect) {
                  return (
                    optionLabels.get(selectedValues[0]) ?? selectedValues[0]
                  );
                }

                return (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selectedValues.map((value) => (
                      <Chip
                        key={value}
                        label={optionLabels.get(value) ?? value}
                        size="small"
                      />
                    ))}
                  </Box>
                );
              }}
              onChange={(event) => {
                const value = event.target.value;

                onChange({
                  ...element,
                  defaultValue: isMultiSelect
                    ? typeof value === 'string'
                      ? value.split(',').filter(Boolean)
                      : value
                    : String(value),
                });
              }}
            >
              {!isMultiSelect ? (
                <MenuItem value="">
                  <em>{t('None')}</em>
                </MenuItem>
              ) : null}
              {normalizedOptions.map((option, index) => (
                <MenuItem key={option.value || index} value={option.value}>
                  {isMultiSelect ? (
                    <Checkbox
                      size="small"
                      checked={getDropboxDefaultValues(
                        element.defaultValue,
                      ).includes(option.value)}
                    />
                  ) : null}
                  <ListItemText primary={option.label} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      );
    }
    case 'search':
      return (
        <Stack spacing={2}>
          <TextField
            label={t('Default Value')}
            size="small"
            fullWidth
            disabled={isReadonly}
            value={element.defaultValue}
            onChange={(event) =>
              onChange({ ...element, defaultValue: event.target.value })
            }
          />
          <TextField
            label={t('Placeholder')}
            size="small"
            fullWidth
            disabled={isReadonly}
            value={element.placeholder}
            onChange={(event) =>
              onChange({ ...element, placeholder: event.target.value })
            }
          />
          <TextField
            label={t('API URL')}
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
            <InputLabel id="search-method-label">{t('Method')}</InputLabel>
            <Select
              labelId="search-method-label"
              label={t('Method')}
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
            label={t('Headers')}
            helperText={t(
              'Use {{slotName}} for dynamic values in JSON header strings',
            )}
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
            label={t('Body Template')}
            helperText={t(
              'Use {{value}} to insert the search term. You can also use other slots like {{slotName}}',
            )}
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
            label={t('Input Fill Key')}
            helperText={t(
              'Key from the selected grid row to fill the search input field. (Defaults to the first column if empty)',
            )}
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
            label={t('Result Slot')}
            helperText={t(
              "The API response data will be stored in this slot. A Grid element can use this slot in its 'Data Slot' field",
            )}
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
            label={t('Data Slot')}
            helperText={t('Bind to array in slot')}
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
              label={t('Display Labels')}
              helperText={'Enter a new line in key:label format'}
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
                label={t('Data')}
                helperText={t('Enter each cell value as a comma or a new line')}
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
            label={t('Display Labels')}
            helperText={t('Enter a new line in key:label format')}
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
