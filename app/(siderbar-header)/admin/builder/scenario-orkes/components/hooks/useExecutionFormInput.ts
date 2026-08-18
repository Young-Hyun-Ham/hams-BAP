import { useCallback, useEffect, useState } from 'react';

import { builderExecutionStore } from '../../../store/builderExecutionStore';
import { getExecutionElementKey } from '../modals/ExecutionFormInputModal';

import type { ExecutionFormElement } from '../../types';

import apiClient from '@/lib/api/apiClient';
import {
  mapResponseToTargetElement,
  parseOptionalParameter,
} from '../../../form-builder/components/CustomElementPropertyEditor';

const DEFAULT_FORM_API_HEADERS = `{
  "Content-Type":"application/json",
  "Accept":"application/json",
  "X-API-KEY":"6458f478e47abbea0079a1fe7e5f1417",
  "X-TEN-ID":"2000"
}`;

export function useExecutionFormInput() {
  const pendingFormInput = builderExecutionStore(
    (state) => state.pendingFormInput,
  );
  const [executionFormElements, setExecutionFormElements] = useState<
    ExecutionFormElement[]
  >([]);
  const [executionFormValues, setExecutionFormValues] = useState<
    Record<string, unknown>
  >({});

  useEffect(() => {
    if (!pendingFormInput) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExecutionFormElements([]);
      setExecutionFormValues({});
      return;
    }

    setExecutionFormElements(
      (
        (pendingFormInput.elements as ExecutionFormElement[] | undefined) ?? []
      ).filter(Boolean),
    );
    setExecutionFormValues(
      (pendingFormInput.initialValues as Record<string, unknown> | undefined) ??
        {},
    );
  }, [pendingFormInput]);

  const getExecutionElementKeyByElement = useCallback(
    (element: ExecutionFormElement) => {
      const index = executionFormElements.findIndex(
        (item) => item === element || item.id === element.id,
      );
      return getExecutionElementKey(element, Math.max(index, 0));
    },
    [executionFormElements],
  );

  const buildExecutionFormApiPayload = useCallback(
    (
      sourceElement: ExecutionFormElement,
      nextValues: Record<string, unknown>,
    ) => {
      const sourceValues: Record<string, unknown> = {
        ...(pendingFormInput?.slots ?? {}),
      };

      executionFormElements.forEach((item, index) => {
        const key = getExecutionElementKey(item, index);
        const value =
          nextValues[key] ??
          (item.name ? nextValues[item.name] : undefined) ??
          (item.id ? nextValues[item.id] : undefined) ??
          item.defaultValue ??
          '';

        if (item.id) sourceValues[item.id] = value;
        if (item.name) sourceValues[item.name] = value;
      });

      const sourceKey = getExecutionElementKeyByElement(sourceElement);
      const sourceValue = nextValues[sourceKey] ?? '';
      sourceValues.value = sourceValue;

      let payload: Record<string, unknown> = {};
      try {
        payload = parseOptionalParameter(
          sourceElement.optionalParameter,
          sourceValues,
        );
      } catch (error) {
        console.warn('Invalid Optional Parameter JSON:', error);
      }

      return payload;
    },
    [
      executionFormElements,
      getExecutionElementKeyByElement,
      pendingFormInput?.slots,
    ],
  );

  const applyExecutionApiResponseToTarget = useCallback(
    (sourceElement: ExecutionFormElement, response: unknown) => {
      if (!sourceElement.targetElementId) return;

      setExecutionFormElements((prev) => {
        const targetElement = prev.find(
          (item) => item.id === sourceElement.targetElementId,
        );
        if (!targetElement) return prev;

        const mappedTarget = mapResponseToTargetElement(
          targetElement as any,
          response,
          sourceElement.responsePath,
        ) as ExecutionFormElement;

        const targetKey = getExecutionElementKey(
          targetElement,
          Math.max(
            prev.findIndex((item) => item.id === targetElement.id),
            0,
          ),
        );

        setExecutionFormValues((currentValues) => {
          if (!(targetKey in currentValues)) return currentValues;

          const allowedValues = new Set(
            (mappedTarget.options ?? []).map((option, index) => {
              if (option && typeof option === 'object') {
                return String(option.value ?? option.label ?? index + 1);
              }
              return String(option ?? '');
            }),
          );
          const currentValue = currentValues[targetKey];
          const isStillValid = Array.isArray(currentValue)
            ? currentValue.every((item) => allowedValues.has(String(item)))
            : allowedValues.has(String(currentValue));

          return isStillValid
            ? currentValues
            : { ...currentValues, [targetKey]: '' };
        });

        return prev.map((item) =>
          item.id === mappedTarget.id ? mappedTarget : item,
        );
      });
    },
    [],
  );

  const runExecutionFormElementApi = useCallback(
    async (
      element: ExecutionFormElement,
      nextValues: Record<string, unknown>,
    ) => {
      const endpoint =
        typeof element.apiData?.endPoint === 'string'
          ? element.apiData.endPoint.trim()
          : '';
      if (!endpoint || !element.targetElementId) return;

      const method =
        typeof element.apiData?.method === 'string'
          ? element.apiData.method.toLowerCase()
          : 'get';
      const headersText =
        typeof element.apiData?.headers === 'string' &&
        element.apiData.headers.trim()
          ? element.apiData.headers.trim()
          : DEFAULT_FORM_API_HEADERS;

      try {
        const headers = JSON.parse(headersText);
        const payload = buildExecutionFormApiPayload(element, nextValues);
        const parameterKey = element.parameterId?.trim();
        const sourceKey = getExecutionElementKeyByElement(element);
        const parameterParams = parameterKey
          ? {
              [parameterKey]: nextValues[sourceKey] ?? '',
            }
          : {};
        const clientMethod = apiClient[
          method as keyof typeof apiClient
        ] as unknown as (...args: any[]) => Promise<unknown>;

        if (typeof clientMethod !== 'function') return;

        const response =
          method === 'get' || method === 'delete'
            ? await clientMethod(endpoint, {
                params: {
                  ...payload,
                  ...parameterParams,
                },
                headers,
              })
            : await clientMethod(endpoint, payload, {
                params: parameterParams,
                headers,
              });

        applyExecutionApiResponseToTarget(element, response);
      } catch (error) {
        console.error('Execution form onchange API call failed:', error);
      }
    },
    [
      applyExecutionApiResponseToTarget,
      buildExecutionFormApiPayload,
      getExecutionElementKeyByElement,
    ],
  );

  const updateExecutionFormCheckbox = useCallback(
    (
      name: string,
      value: string,
      checked: boolean,
      element?: ExecutionFormElement,
    ) => {
      setExecutionFormValues((prev) => {
        if (element?.sendByOption) {
          const current =
            prev[name] &&
            typeof prev[name] === 'object' &&
            !Array.isArray(prev[name])
              ? (prev[name] as Record<string, unknown>)
              : {};
          const option = element.options?.find((item) =>
            typeof item === 'string' ? item === value : item.value === value,
          );
          const param =
            typeof option === 'string'
              ? option
              : option?.param?.trim() || option?.value || value;
          const nextValues = {
            ...prev,
            [name]: { ...current, [param]: checked ? 'Y' : 'N' },
          };

          if (element.eventType === 'onChange') {
            void runExecutionFormElementApi(element, nextValues);
          }

          return nextValues;
        }

        const current = Array.isArray(prev[name]) ? prev[name] : [];
        const nextValues = {
          ...prev,
          [name]: checked
            ? [...current, value]
            : current.filter((item) => item !== value),
        };

        if (element?.eventType === 'onChange') {
          void runExecutionFormElementApi(element, nextValues);
        }

        return nextValues;
      });
    },
    [runExecutionFormElementApi],
  );

  const updateExecutionFormValue = useCallback(
    (name: string, value: unknown, element?: ExecutionFormElement) => {
      setExecutionFormValues((prev) => {
        const nextValues = {
          ...prev,
          [name]: value,
        };

        if (element?.eventType === 'onChange') {
          void runExecutionFormElementApi(element, nextValues);
        }

        return nextValues;
      });
    },
    [runExecutionFormElementApi],
  );

  return {
    pendingFormInput,
    executionFormElements,
    executionFormValues,
    updateExecutionFormCheckbox,
    updateExecutionFormValue,
  };
}
