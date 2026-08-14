import { useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import type { DisplayValue, FormElement, GridElement } from '../type';
import type { NxApis, NxMethod } from '../type';

import apiClient from '@/lib/api/apiClient';

export const getElementDefaultValue = (element: FormElement): unknown => {
  if ('defaultValue' in element) return element.defaultValue;
  return '';
};

const getNestedValue = (value: unknown, path: string): unknown => {
  if (!path.trim()) return value;

  return path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .filter(Boolean)
    .reduce<unknown>((currentValue, key) => {
      if (currentValue == null) return undefined;

      if (Array.isArray(currentValue)) {
        return currentValue[Number(key)];
      }

      if (typeof currentValue === 'object') {
        return (currentValue as Record<string, unknown>)[key];
      }

      return undefined;
    }, value);
};

const getMappableResponseValue = (
  response: unknown,
  responsePath?: string,
): unknown => {
  if (responsePath?.trim()) {
    return getNestedValue(response, responsePath);
  }

  if (!response || typeof response !== 'object' || Array.isArray(response)) {
    return response;
  }

  const responseObject = response as Record<string, unknown>;
  for (const key of ['data', 'result', 'items', 'list', 'rows']) {
    if (key in responseObject) return responseObject[key];
  }

  return response;
};

const stringifyValue = (value: unknown): string => {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    const preferredValue =
      record.value ?? record.label ?? record.name ?? record.title ?? record.id;
    if (preferredValue != null) return stringifyValue(preferredValue);
  }

  return JSON.stringify(value);
};

const normalizeOptions = (value: unknown): DisplayValue[] => {
  const source = Array.isArray(value)
    ? value
    : value && typeof value === 'object'
      ? Object.entries(value as Record<string, unknown>).map(([key, item]) => ({
          value: key,
          label: stringifyValue(item),
        }))
      : value != null
        ? [value]
        : [];

  return source
    .map((item, index): DisplayValue | null => {
      if (typeof item === 'string') return { value: item, label: item };
      if (typeof item === 'number' || typeof item === 'boolean') {
        const text = String(item);
        return { value: text, label: text };
      }
      if (!item || typeof item !== 'object') return null;

      const record = item as Record<string, unknown>;
      const valueCandidate =
        record.value ?? record.id ?? record.code ?? record.key ?? index + 1;
      const labelCandidate =
        record.label ??
        record.name ??
        record.title ??
        record.text ??
        valueCandidate;

      return {
        value: stringifyValue(valueCandidate),
        label: stringifyValue(labelCandidate),
      };
    })
    .filter((item): item is DisplayValue => Boolean(item));
};

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(stringifyValue).filter(Boolean);
  const text = stringifyValue(value);
  return text ? [text] : [];
};

const formatDateValue = (value: unknown): string => {
  const text = stringifyValue(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;

  return date.toISOString().slice(0, 10);
};

export const mapResponseToTargetElement = (
  targetElement: FormElement,
  response: unknown,
  responsePath?: string,
): FormElement => {
  const value = getMappableResponseValue(response, responsePath);

  switch (targetElement.type) {
    case 'input':
    case 'search':
      return {
        ...targetElement,
        defaultValue: stringifyValue(Array.isArray(value) ? value[0] : value),
      };
    case 'date':
      return {
        ...targetElement,
        defaultValue: formatDateValue(Array.isArray(value) ? value[0] : value),
      };
    case 'checkbox': {
      const options = normalizeOptions(value);
      const defaultValue = normalizeStringArray(
        Array.isArray(value)
          ? value.map((item) => stringifyValue(item))
          : value,
      );

      return {
        ...targetElement,
        options: options.length ? options : targetElement.options,
        defaultValue,
      };
    }
    case 'radio': {
      const options = normalizeOptions(value);
      const firstValue = Array.isArray(value) ? value[0] : value;

      return {
        ...targetElement,
        options: options.length ? options : targetElement.options,
        defaultValue: stringifyValue(firstValue),
      };
    }
    case 'dropbox': {
      const options = normalizeOptions(value);
      const selectedValues = normalizeStringArray(value);

      return {
        ...targetElement,
        options: options.length ? options : targetElement.options,
        defaultValue:
          targetElement.selectKind === 'multi'
            ? selectedValues
            : (selectedValues[0] ?? ''),
      };
    }
    case 'grid': {
      const rows = Array.isArray(value) ? value : value != null ? [value] : [];
      const firstObject = rows.find(
        (item) => item && typeof item === 'object' && !Array.isArray(item),
      ) as Record<string, unknown> | undefined;
      const firstArray = rows.find(Array.isArray) as unknown[] | undefined;
      const displayKeys = firstObject
        ? Object.keys(firstObject).map((key) => ({ key, label: key }))
        : firstArray
          ? firstArray.map((_, index) => ({
              key: String(index),
              label: `Column ${index + 1}`,
            }))
          : targetElement.displayKeys.length
            ? targetElement.displayKeys
            : [{ key: 'value', label: 'Value' }];
      const columns = Math.max(displayKeys.length, 1);
      const headerData = displayKeys.map((item) => item.label);
      const bodyData = rows.flatMap((row) => {
        if (row && typeof row === 'object' && !Array.isArray(row)) {
          return displayKeys.map((item) =>
            stringifyValue((row as Record<string, unknown>)[item.key]),
          );
        }
        if (Array.isArray(row)) {
          return displayKeys.map((_, index) => stringifyValue(row[index]));
        }
        return [
          stringifyValue(row),
          ...Array.from({ length: columns - 1 }, () => ''),
        ];
      });
      const gridData = rows.length ? [...headerData, ...bodyData] : headerData;

      return {
        ...targetElement,
        rows: Math.max(rows.length + 1, 1),
        columns,
        displayKeys,
        data: gridData.length ? gridData : targetElement.data,
      };
    }
    default:
      return targetElement;
  }
};

const interpolatePayloadText = (
  text: string,
  values: Record<string, unknown>,
) =>
  text.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, key: string) =>
    stringifyValue(values[key.trim()]),
  );

export const parseOptionalParameter = (
  rawValue: string | undefined,
  values: Record<string, unknown>,
) => {
  const text = rawValue?.trim();
  if (!text) return {};

  const parsed = JSON.parse(interpolatePayloadText(text, values));
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown>;
  }

  throw new Error('Optional Parameter must be a JSON object.');
};

function CustomElementPropertyEditor({
  element,
  elements,
  onChange,
  onGridSizeChange,
  isReadonly = false,
}: {
  element: FormElement;
  elements: FormElement[];
  onChange: (element: FormElement) => void;
  onGridSizeChange: (
    element: GridElement,
    key: 'rows' | 'columns',
    value: number,
  ) => void;
  isReadonly?: boolean;
}) {
  const { t } = useTranslation();
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [responseData, setResponseData] = useState<unknown>(null);
  const [responseError, setResponseError] = useState('');
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  void onGridSizeChange;

  const apiData = element.apiData as NxApis | null | undefined;
  const targetElement =
    elements.find((item) => item.id === element.targetElementId) ?? null;

  const handleSelectApi = (api: NxApis) => {
    onChange({
      ...element,
      apiId: api.id || '',
      apiData: api as unknown as Record<string, unknown>,
    });
    setIsApiModalOpen(false);
  };

  const getParameterQueryParams = (
    parameterId: string | undefined,
    currentValue: unknown,
  ) => {
    const key = parameterId?.trim();
    if (!key) return {};

    return {
      [key]: currentValue,
    };
  };

  const buildRequestPayload = () => {
    const sourceValues = Object.fromEntries(
      elements.flatMap((item) => {
        const value = getElementDefaultValue(item);
        return [
          [item.id, value],
          ...(item.name ? [[item.name, value] as const] : []),
        ];
      }),
    );

    return parseOptionalParameter(element.optionalParameter, sourceValues);
  };

  const applyResponseToTarget = (response: unknown) => {
    if (!targetElement) {
      setResponseError(t('Target Element ID is required.'));
      return;
    }

    onChange(
      mapResponseToTargetElement(targetElement, response, element.responsePath),
    );
    // close
    setIsResponseDialogOpen(false);
  };

  const fnCustomElementUI = () => {
    return (
      <Stack spacing={2}>
        <Dialog
          open={isResponseDialogOpen}
          onClose={() => setIsResponseDialogOpen(false)}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>{t('API Response Data')}</DialogTitle>
          <DialogContent dividers>
            <TextField
              value={JSON.stringify(responseData, null, 2)}
              fullWidth
              multiline
              minRows={12}
              InputProps={{ readOnly: true }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              disabled={!responseData || !targetElement || isReadonly}
              onClick={() => applyResponseToTarget(responseData)}
            >
              {t('Apply to Target')}
            </Button>
            <Button onClick={() => setIsResponseDialogOpen(false)}>
              {t('Close')}
            </Button>
          </DialogActions>
        </Dialog>
        {/*
        <FormControl fullWidth size="small">
          <InputLabel id="validation-label">{t('Method')}</InputLabel>
          <Select
            labelId="validation-label"
            label={t('Method')}
            disabled={isReadonly}
            value={apiData?.method ?? "get"}
            onChange={(event) =>
              onChange({ ...element, apiData: { ...element.apiData, method: event.target.value } })
            }
          >
            <MenuItem value="get">GET</MenuItem>
            <MenuItem value="post">POST</MenuItem>
            <MenuItem value="put">PUT</MenuItem>
            <MenuItem value="delete">DELETE</MenuItem>
            <MenuItem value="patch">PATCH</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label={t('headers (JSON)')}
          size="small"
          fullWidth
          multiline
          minRows={4}
          value={apiData?.headers ?? ""}
          onChange={(event) =>
            onChange({ ...element, apiData: { ...element.apiData, headers: event.target.value } })
          }
          // InputProps={{ readOnly: true }}
        />
        */}
        <TextField
          label={t('API ID')}
          size="small"
          fullWidth
          value={element.apiId ?? ''}
          InputProps={{ readOnly: true }}
        />
        <TextField
          label={t('Endpoint')}
          size="small"
          fullWidth
          value={apiData?.endPoint ?? ''}
          onChange={(event) =>
            onChange({
              ...element,
              apiData: { ...element.apiData, endPoint: event.target.value },
            })
          }
          // InputProps={{ readOnly: true }}
        />
        <FormControl fullWidth size="small">
          <InputLabel id="validation-label">{t('event type')}</InputLabel>
          <Select
            labelId="validation-label"
            label={t('event type')}
            disabled={isReadonly}
            value={element.eventType ?? 'onChange'}
            onChange={(event) =>
              onChange({
                ...element,
                eventType: event.target.value as FormElement['eventType'],
              })
            }
          >
            <MenuItem value="">
              <em>{t('None')}</em>
            </MenuItem>
            <MenuItem value="onChange">onChange</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label={t('Parameter ID')}
          size="small"
          fullWidth
          disabled={isReadonly}
          value={element.parameterId ?? ''}
          onChange={(event) =>
            onChange({ ...element, parameterId: event.target.value })
          }
        />
        <TextField
          label={t('Optional Parameter')}
          helperText={t('Enter additional API parameters as JSON object')}
          size="small"
          fullWidth
          multiline
          minRows={4}
          disabled={isReadonly}
          value={element.optionalParameter ?? ''}
          onChange={(event) =>
            onChange({ ...element, optionalParameter: event.target.value })
          }
        />
        <FormControl fullWidth size="small">
          <InputLabel id="target-element-id-label">
            {t('Target Element ID')}
          </InputLabel>
          <Select
            labelId="target-element-id-label"
            label={t('Target Element ID')}
            disabled={isReadonly}
            value={element.targetElementId ?? ''}
            onChange={(event) =>
              onChange({ ...element, targetElementId: event.target.value })
            }
          >
            <MenuItem value="">
              <em>{t('None')}</em>
            </MenuItem>
            {elements
              .filter((item) => item.id !== element.id)
              .map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.label || item.id} ({item.type})
                </MenuItem>
              ))}
          </Select>
        </FormControl>
        <TextField
          label={t('Response Path')}
          helperText={t(
            'Optional dot path to map from the response, for example data.items',
          )}
          size="small"
          fullWidth
          disabled={isReadonly}
          value={element.responsePath ?? ''}
          onChange={(event) =>
            onChange({ ...element, responsePath: event.target.value })
          }
        />
        {responseError ? <Alert severity="error">{responseError}</Alert> : null}
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            size="small"
            sx={{ fontSize: '10px' }}
            disabled={isReadonly}
            onClick={() => setIsApiModalOpen(true)}
          >
            {t('API Modal popup')}
          </Button>
          <Button
            variant="outlined"
            size="small"
            sx={{ fontSize: '10px' }}
            disabled={isReadonly || isExecuting}
            onClick={() => void handleRunApi(false)}
            startIcon={isExecuting ? <CircularProgress size={14} /> : undefined}
          >
            {t('Run API')}
          </Button>
          <Button
            variant="outlined"
            size="small"
            sx={{ fontSize: '10px' }}
            disabled={isReadonly || isExecuting || !element.targetElementId}
            onClick={() => void handleRunApi(true)}
          >
            {t('Run and Apply')}
          </Button>
        </Stack>
      </Stack>
    );
  };

  const handleRunApi = async (shouldApplyTarget: boolean) => {
    const mockMethod = 'get';
    const mockHeaders = `{
  "Content-Type":"application/json",
  "Accept":"application/json",
  "X-API-KEY":"6458f478e47abbea0079a1fe7e5f1417",
  "X-TEN-ID":"2000"
}`;
    const endpoint = apiData?.endPoint?.trim();

    const method = apiData?.method?.trim() ?? mockMethod;
    const httpMethod = method.toLowerCase() as NxMethod;
    const headersStr = apiData?.headers?.trim() ?? mockHeaders;
    // apiData에 method(get, post, put, delete, patch) 및 headers, body 데이터가 없음.
    // console.log("============> ", endpoint)
    if (!endpoint) {
      setResponseError(t('Endpoint is required.'));
      return;
    }
    if (!httpMethod) {
      setResponseError(t('HTTP method is required.'));
      return;
    }
    if (!headersStr) {
      setResponseError(t('Headers are required.'));
      return;
    }

    setIsExecuting(true);
    setResponseError('');

    try {
      const parsedHeaders = JSON.parse(headersStr);
      const payload = buildRequestPayload();
      const parameterParams = getParameterQueryParams(
        element.parameterId,
        getElementDefaultValue(element),
      );
      let response;
      if (httpMethod === 'get' || httpMethod === 'delete') {
        response = await apiClient[httpMethod](endpoint, {
          params: {
            ...payload,
            ...parameterParams,
          },
          headers: parsedHeaders,
        });
      } else {
        response = await apiClient[httpMethod](endpoint, payload, {
          params: parameterParams,
          headers: parsedHeaders,
        });
      }

      setResponseData(response);
      setIsResponseDialogOpen(true);

      if (shouldApplyTarget) {
        applyResponseToTarget(response);
      }
    } catch (error) {
      setResponseError(
        error instanceof Error ? error.message : t('API request failed.'),
      );
    } finally {
      setIsExecuting(false);
    }
  };

  switch (element.type) {
    case 'input':
    case 'date':
    case 'checkbox':
    case 'radio':
    case 'dropbox':
    case 'grid':
      return fnCustomElementUI();
    case 'search':
      break;
    default:
      return null;
  }
}

export default CustomElementPropertyEditor;
