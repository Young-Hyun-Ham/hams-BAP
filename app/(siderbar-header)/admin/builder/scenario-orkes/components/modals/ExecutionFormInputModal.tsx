import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  ListItemText,
  MenuItem,
  Radio,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import type { ExecutionFormElement, ExecutionFormOption } from '../../types';

type PendingFormInput = {
  title?: string;
  slots?: Record<string, unknown>;
} | null;

type ExecutionFormInputModalProps = {
  pendingFormInput: PendingFormInput;
  elements: ExecutionFormElement[];
  values: Record<string, unknown>;
  onCancel: () => void;
  onSubmit: (values: Record<string, unknown>) => void;
  onUpdateValue: (
    name: string,
    value: unknown,
    element?: ExecutionFormElement,
  ) => void;
  onUpdateCheckbox: (
    name: string,
    value: string,
    checked: boolean,
    element?: ExecutionFormElement,
  ) => void;
};

const normalizeExecutionFormOption = (
  option: ExecutionFormOption,
  index: number,
) => {
  if (typeof option === 'object' && option !== null) {
    const value = String(option.value ?? option.label ?? index);
    return {
      value,
      label: String(option.label ?? option.value ?? value),
      param: option.param?.trim() || value,
    };
  }

  const value = String(option ?? index);
  return {
    value,
    label: value,
    param: value,
  };
};

const getExecutionElementKey = (element: ExecutionFormElement, index: number) =>
  element.name?.trim() || element.id || `${element.type || 'element'}-${index}`;

const getGridDisplayColumns = (
  element: ExecutionFormElement,
  rows: Record<string, unknown>[],
) => {
  const sourceColumns =
    element.displayKeys && element.displayKeys.length > 0
      ? element.displayKeys
      : Object.keys(rows[0] || {});

  const columns = sourceColumns
    .map((column) => {
      if (typeof column === 'string') {
        return { key: column, label: column };
      }

      if (column?.key) {
        return { key: column.key, label: column.label || column.key };
      }

      return null;
    })
    .filter(Boolean) as Array<{ key: string; label: string }>;

  if (!element.hideNullColumns) return columns;

  return columns.filter((column) =>
    rows.some((row) => {
      const value = row[column.key];
      return value !== null && value !== undefined && value !== '';
    }),
  );
};

export { getExecutionElementKey };

export default function ExecutionFormInputModal({
  pendingFormInput,
  elements,
  values,
  onCancel,
  onSubmit,
  onUpdateValue,
  onUpdateCheckbox,
}: ExecutionFormInputModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={!!pendingFormInput}
      onClose={onCancel}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ fontWeight: 700 }}>
        {pendingFormInput?.title || t('Form input')}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ py: 0.5 }}>
          {elements.map((element, elementIndex) => {
            const elementName = getExecutionElementKey(element, elementIndex);
            const label =
              element.label ||
              element.name ||
              element.type ||
              `Element ${elementIndex + 1}`;
            const value = values[elementName];
            const slotValue = element.optionsSlot
              ? pendingFormInput?.slots?.[element.optionsSlot]
              : undefined;

            if (element.type === 'checkbox') {
              const options =
                Array.isArray(slotValue) && slotValue.length > 0
                  ? (slotValue as ExecutionFormOption[])
                  : element.options || [];
              const checkedValues = Array.isArray(value) ? value : [];
              const optionParams =
                value && typeof value === 'object' && !Array.isArray(value)
                  ? (value as Record<string, unknown>)
                  : {};

              return (
                <Box key={element.id || element.name}>
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 0.75, fontWeight: 600 }}
                  >
                    {label}
                  </Typography>
                  <Stack spacing={0.5}>
                    {options.length === 0 && (
                      <Typography
                        variant="body2"
                        sx={{ color: 'text.secondary' }}
                      >
                        {t('No options')}
                      </Typography>
                    )}
                    {options.map((option, index: number) => {
                      const {
                        value: optionValue,
                        label: optionLabel,
                        param: optionParam,
                      } =
                        normalizeExecutionFormOption(option, index);

                      return (
                        <FormControlLabel
                          key={`${elementName}-${optionValue || index}`}
                          control={
                            <Checkbox
                              checked={
                                element.sendByOption
                                  ? optionParams[optionParam] === 'Y'
                                  : checkedValues.includes(optionValue)
                              }
                              onChange={(event) =>
                                onUpdateCheckbox(
                                  elementName,
                                  optionValue,
                                  event.target.checked,
                                  element,
                                )
                              }
                              size="small"
                            />
                          }
                          label={optionLabel}
                          sx={{
                            m: 0,
                            '& .MuiFormControlLabel-label': {
                              fontSize: 14,
                            },
                          }}
                        />
                      );
                    })}
                  </Stack>
                </Box>
              );
            }

            if (element.type === 'radio') {
              const options =
                Array.isArray(slotValue) && slotValue.length > 0
                  ? (slotValue as ExecutionFormOption[])
                  : element.options || [];

              return (
                <Box key={element.id || element.name}>
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 0.5, fontWeight: 700 }}
                  >
                    {label}
                  </Typography>
                  <Stack spacing={0.5}>
                    {options.length === 0 && (
                      <Typography
                        variant="body2"
                        sx={{ color: 'text.secondary' }}
                      >
                        {t('No options')}
                      </Typography>
                    )}
                    {options.map((option, index: number) => {
                      const {
                        value: optionValue,
                        label: optionLabel,
                        param: optionParam,
                      } =
                        normalizeExecutionFormOption(option, index);

                      return (
                        <FormControlLabel
                          key={`${elementName}-${optionValue || index}`}
                          control={
                            <Radio
                              checked={
                                element.sendByOption
                                  ? Boolean(
                                      value &&
                                        typeof value === 'object' &&
                                        !Array.isArray(value) &&
                                        (value as Record<string, unknown>)[
                                          optionParam
                                        ] === 'Y',
                                    )
                                  : String(value ?? '') === optionValue
                              }
                              onClick={() => {
                                const isSelected = element.sendByOption
                                  ? Boolean(
                                      value &&
                                        typeof value === 'object' &&
                                        !Array.isArray(value) &&
                                        (value as Record<string, unknown>)[
                                          optionParam
                                        ] === 'Y',
                                    )
                                  : String(value ?? '') === optionValue;
                                const shouldDeselect =
                                  element.allowDeselection && isSelected;

                                if (!element.sendByOption) {
                                  onUpdateValue(
                                    elementName,
                                    shouldDeselect ? '' : optionValue,
                                    element,
                                  );
                                  return;
                                }

                                onUpdateValue(
                                  elementName,
                                  Object.fromEntries(
                                    options.map((item, optionIndex) => {
                                      const normalized =
                                        normalizeExecutionFormOption(
                                          item,
                                          optionIndex,
                                        );
                                      return [
                                        normalized.param,
                                        !shouldDeselect &&
                                        normalized.value === optionValue
                                          ? 'Y'
                                          : 'N',
                                      ];
                                    }),
                                  ),
                                  element,
                                );
                              }}
                              size="small"
                            />
                          }
                          label={optionLabel}
                          sx={{
                            m: 0,
                            '& .MuiFormControlLabel-label': {
                              fontSize: 14,
                            },
                          }}
                        />
                      );
                    })}
                  </Stack>
                </Box>
              );
            }

            if (element.type === 'dropbox') {
              const options =
                Array.isArray(slotValue) && slotValue.length > 0
                  ? (slotValue as ExecutionFormOption[])
                  : element.options || [];
              const normalizedOptions = options.map((option, index) =>
                normalizeExecutionFormOption(option, index),
              );
              const isMultiSelect = element.selectKind === 'multi';
              const selectedValues = Array.isArray(value)
                ? value.map(String)
                : value
                  ? [String(value)]
                  : [];
              const optionLabels = new Map(
                normalizedOptions.map((option) => [option.value, option.label]),
              );

              return (
                <FormControl
                  key={element.id || element.name}
                  fullWidth
                  size="small"
                >
                  <InputLabel>{label}</InputLabel>
                  <Select
                    label={label}
                    multiple={isMultiSelect}
                    value={
                      isMultiSelect ? selectedValues : (selectedValues[0] ?? '')
                    }
                    renderValue={(selected) => {
                      const selectedList = Array.isArray(selected)
                        ? selected
                        : selected
                          ? [String(selected)]
                          : [];

                      if (!selectedList.length) return t('Select');

                      if (!isMultiSelect) {
                        return (
                          optionLabels.get(selectedList[0]) ?? selectedList[0]
                        );
                      }

                      return (
                        <Box
                          sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}
                        >
                          {selectedList.map((selectedValue) => (
                            <Chip
                              key={selectedValue}
                              label={
                                optionLabels.get(selectedValue) ?? selectedValue
                              }
                              size="small"
                            />
                          ))}
                        </Box>
                      );
                    }}
                    onChange={(event) => {
                      const nextValue = event.target.value;

                      onUpdateValue(
                        elementName,
                        isMultiSelect
                          ? typeof nextValue === 'string'
                            ? nextValue.split(',').filter(Boolean)
                            : nextValue
                          : String(nextValue),
                        element,
                      );
                    }}
                  >
                    {!isMultiSelect ? (
                      <MenuItem value="">
                        <em>{t('Select')}</em>
                      </MenuItem>
                    ) : null}
                    {normalizedOptions.map((option, index: number) => (
                      <MenuItem
                        key={`${option.value || index}`}
                        value={option.value}
                      >
                        {isMultiSelect ? (
                          <Checkbox
                            size="small"
                            checked={selectedValues.includes(option.value)}
                          />
                        ) : null}
                        <ListItemText primary={option.label} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              );
            }

            if (element.type === 'grid') {
              const slotGridData = Array.isArray(slotValue) ? slotValue : null;
              const gridData =
                slotGridData && slotGridData.length > 0
                  ? slotGridData
                  : element.data || [];
              const objectRows = gridData.filter(
                (row): row is Record<string, unknown> =>
                  typeof row === 'object' &&
                  row !== null &&
                  !Array.isArray(row),
              );
              const hasObjectRows =
                objectRows.length > 0 && objectRows.length === gridData.length;

              if (hasObjectRows) {
                const columns = getGridDisplayColumns(element, objectRows);

                return (
                  <Box key={element.id || elementName}>
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 0.75, fontWeight: 600 }}
                    >
                      {t(label)}
                    </Typography>
                    <Box sx={{ overflowX: 'auto' }}>
                      <Box
                        component="table"
                        sx={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          '& th, & td': {
                            border: '1px solid',
                            borderColor: 'divider',
                            px: 1,
                            py: 0.75,
                            fontSize: 13,
                            textAlign: 'left',
                          },
                          '& th': {
                            bgcolor: 'grey.50',
                            fontWeight: 700,
                          },
                        }}
                      >
                        <thead>
                          <tr>
                            {columns.map((column) => (
                              <th key={column.key}>{column.label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {objectRows.map((row, rowIndex) => (
                            <tr key={`${elementName}-${rowIndex}`}>
                              {columns.map((column) => (
                                <td key={column.key}>
                                  {String(row[column.key] ?? '')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </Box>
                    </Box>
                  </Box>
                );
              }

              const rows = element.rows || 2;
              const columns = element.columns || 2;
              const flatGridData = gridData.flatMap((item) =>
                Array.isArray(item) ? item : [item],
              );

              return (
                <Box key={element.id || elementName}>
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 0.75, fontWeight: 600 }}
                  >
                    {t(label)}
                  </Typography>
                  <Box sx={{ overflowX: 'auto' }}>
                    <Box
                      component="table"
                      sx={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        '& td': {
                          border: '1px solid',
                          borderColor: 'divider',
                          px: 1,
                          py: 0.75,
                          fontSize: 13,
                          minWidth: 80,
                        },
                      }}
                    >
                      <tbody>
                        {Array.from({ length: rows }).map((_, rowIndex) => (
                          <tr key={`${elementName}-${rowIndex}`}>
                            {Array.from({ length: columns }).map(
                              (__, columnIndex) => {
                                const cellIndex =
                                  rowIndex * columns + columnIndex;
                                return (
                                  <td key={columnIndex}>
                                    {String(flatGridData[cellIndex] ?? '')}
                                  </td>
                                );
                              },
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </Box>
                  </Box>
                </Box>
              );
            }

            return (
              <TextField
                key={element.id || elementName}
                fullWidth
                size="small"
                label={label}
                type={element.type === 'date' ? 'date' : 'text'}
                value={String(value ?? '')}
                placeholder={t('element.placeholder') || ''}
                onChange={(event) =>
                  onUpdateValue(elementName, event.target.value, element)
                }
                InputLabelProps={
                  element.type === 'date' ? { shrink: true } : undefined
                }
              />
            );
          })}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onCancel} color="inherit">
          {t('Cancel')}
        </Button>
        <Button variant="contained" onClick={() => onSubmit(values)}>
          {t('Submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
