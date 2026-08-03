import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CustomCellEditorProps } from 'ag-grid-react';
import { Box, InputBase, Tooltip, Typography } from '@mui/material';

const RangeCellEditor = forwardRef((params: CustomCellEditorProps, ref) => {
  // 1. Initialize state from params (the valueGetter provides { from_val, to_val })
  const initialMin = params.value?.from_val;
  const initialMax = params.value?.to_val;

  const [minValue, setMinValue] = useState<string>(
    initialMin != null ? String(initialMin) : '',
  );
  const [maxValue, setMaxValue] = useState<string>(
    initialMax != null ? String(initialMax) : '',
  );
  const [minBadInput, setMinBadInput] = useState(false);
  const [maxBadInput, setMaxBadInput] = useState(false);

  // Refs for DOM focus management
  const minInputRef = useRef<HTMLInputElement>(null);
  const maxInputRef = useRef<HTMLInputElement>(null);

  // 2. CRITICAL: Update ref synchronously so getValue() always has the latest value
  const latestMin = useRef(initialMin != null ? String(initialMin) : '');
  const latestMax = useRef(initialMax != null ? String(initialMax) : '');
  const latestMinBadInput = useRef(false);
  const latestMaxBadInput = useRef(false);

  // Track if user explicitly cancelled (Esc) so cleanup doesn't commit on unmount
  const cancelled = useRef(false);

  // 2b. Validation: min <= max, valid numbers, and both/neither required
  const validationError = useMemo(() => {
    if (minBadInput || maxBadInput) return 'Invalid number';
    const numMin = minValue === '' ? null : Number(minValue);
    const numMax = maxValue === '' ? null : Number(maxValue);
    if (Number.isNaN(numMin) || Number.isNaN(numMax)) return 'Invalid number';
    if (
      (numMin === null && numMax !== null) ||
      (numMin !== null && numMax === null)
    )
      return 'Both Min and Max must be provided';
    if (numMin !== null && numMax !== null && numMin > numMax)
      return 'Min must be ≤ Max';
    return '';
  }, [minValue, maxValue, minBadInput, maxBadInput]);

  const isInvalid = validationError !== '';

  // 3. Expose getValue to AG Grid via forwardRef
  useImperativeHandle(
    ref,
    () => ({
      getValue() {
        const newMin =
          latestMin.current === '' ? null : Number(latestMin.current);
        const newMax =
          latestMax.current === '' ? null : Number(latestMax.current);

        const isNaNValue =
          Number.isNaN(newMin) ||
          Number.isNaN(newMax) ||
          latestMinBadInput.current ||
          latestMaxBadInput.current;
        const isPartialEmpty =
          (newMin === null && newMax !== null) ||
          (newMin !== null && newMax === null);
        const isMinGtMax =
          newMin !== null && newMax !== null && newMin > newMax;

        // Keep the old value if it is invalid
        if (isMinGtMax || isNaNValue || isPartialEmpty) {
          return params.value;
        }

        return {
          from_val: newMin,
          to_val: newMax,
        };
      },
      isPopup() {
        return false;
      },
      isCancelAfterEnd() {
        return false;
      },
    }),
    [],
  );

  // 4. Initial focus
  useEffect(() => {
    const t = setTimeout(() => {
      if (minInputRef.current) {
        minInputRef.current.focus();
        minInputRef.current.select();
      }
    }, 10);
    return () => clearTimeout(t);
  }, []);

  // 4b. Commit on unmount for click-outside case (AG Grid closes editor without Enter/Tab)
  //     Only skip if user pressed Escape (cancelled = true) or value is invalid
  useEffect(() => {
    return () => {
      if (!cancelled.current) {
        const newMin =
          latestMin.current === '' ? null : Number(latestMin.current);
        const newMax =
          latestMax.current === '' ? null : Number(latestMax.current);

        const isNaNValue =
          Number.isNaN(newMin) ||
          Number.isNaN(newMax) ||
          latestMinBadInput.current ||
          latestMaxBadInput.current;
        const isPartialEmpty =
          (newMin === null && newMax !== null) ||
          (newMin !== null && newMax === null);
        const isMinGtMax =
          newMin !== null && newMax !== null && newMin > newMax;

        // If the value is invalid, keep the old value and do not commit the new value
        if (isMinGtMax || isNaNValue || isPartialEmpty) return;

        // Use setDataValue so valueSetter in the column def handles the mapping
        if (params.node?.setDataValue) {
          params.node.setDataValue(params.column, {
            from_val: newMin,
            to_val: newMax,
          });
        }
        setTimeout(() => {
          params.api?.refreshCells({ rowNodes: [params.node], force: true });
        }, 0);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 5. Commit via valueSetter (setDataValue triggers the column's valueSetter)
  const commitEdit = (cancel = false) => {
    if (cancel) {
      cancelled.current = true; // Signal cleanup NOT to commit on unmount
      params.stopEditing(true);
      return;
    }

    // If the value is invalid, cancel edit and keep the old value
    if (isInvalid) {
      cancelled.current = true;
      params.stopEditing(true);
      return;
    }

    const newMin = latestMin.current === '' ? null : Number(latestMin.current);
    const newMax = latestMax.current === '' ? null : Number(latestMax.current);

    // Use setDataValue so valueSetter in the column def handles the mapping
    // (same pattern as SelectBoxCellEditor)
    if (params.node?.setDataValue) {
      params.node.setDataValue(params.column, {
        from_val: newMin,
        to_val: newMax,
      });
    }

    setTimeout(() => params.api?.stopEditing(true), 0);
  };

  // 6. Key event handling
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      commitEdit();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      commitEdit(true);
    } else if (event.key === 'Tab') {
      event.preventDefault();
      event.stopPropagation();
      if (document.activeElement === minInputRef.current) {
        maxInputRef.current?.focus();
      } else {
        commitEdit();
      }
    }
  };

  // 7. onChange handlers - update both state and ref synchronously
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    latestMin.current = e.target.value;
    latestMinBadInput.current = e.target.validity.badInput;
    setMinValue(e.target.value);
    setMinBadInput(e.target.validity.badInput);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    latestMax.current = e.target.value;
    latestMaxBadInput.current = e.target.validity.badInput;
    setMaxValue(e.target.value);
    setMaxBadInput(e.target.validity.badInput);
  };

  const inputSx = (hasError: boolean) => ({
    flex: '1 1 0',
    minWidth: 0,
    '& input': {
      p: '2px 4px',
      fontSize: '0.75rem',
      textAlign: 'center' as const,
      color: hasError ? 'error.main' : 'text.primary',
    },
    '& input[type=number]::-webkit-inner-spin-button, & input[type=number]::-webkit-outer-spin-button':
      {
        WebkitAppearance: 'none',
        margin: 0,
      },
    '& input[type=number]': {
      MozAppearance: 'textfield',
    },
  });

  return (
    <Tooltip
      title={validationError}
      open={isInvalid}
      placement="top"
      arrow
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: 'error.main',
            fontSize: '11px',
            py: '2px',
            px: '6px',
          },
        },
        arrow: { sx: { color: 'error.main' } },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          px: '2px',
          gap: '2px',
          border: '2px solid',
          borderColor: isInvalid ? 'error.main' : 'primary.main',
          borderRadius: '2px',
          backgroundColor: isInvalid ? 'error.50' : 'background.paper',
          boxSizing: 'border-box',
          overflow: 'hidden',
          transition: 'border-color 0.15s, background-color 0.15s',
        }}
      >
        <InputBase
          inputRef={minInputRef}
          type="number"
          placeholder="Min"
          value={minValue}
          onChange={handleMinChange}
          onKeyDown={handleKeyDown}
          onFocus={(e) => e.target.select()}
          sx={inputSx(isInvalid)}
        />
        <Typography
          component="span"
          sx={{
            fontSize: '11px',
            color: isInvalid ? 'error.main' : 'text.secondary',
            flexShrink: 0,
            lineHeight: 1,
            userSelect: 'none',
            transition: 'color 0.15s',
          }}
        >
          ~
        </Typography>
        <InputBase
          inputRef={maxInputRef}
          type="number"
          placeholder="Max"
          value={maxValue}
          onChange={handleMaxChange}
          onKeyDown={handleKeyDown}
          onFocus={(e) => e.target.select()}
          sx={inputSx(isInvalid)}
        />
      </Box>
    </Tooltip>
  );
});

RangeCellEditor.displayName = 'RangeCellEditor';

export default RangeCellEditor;
