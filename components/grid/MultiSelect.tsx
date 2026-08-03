'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  memo,
  useLayoutEffect,
} from 'react';
import { CustomCellRendererProps } from 'ag-grid-react';
import { ICellEditorParams } from 'ag-grid-community';
import TextField from '@mui/material/TextField';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

export interface OptionType {
  id: string;
  label: string;
  color?: string;
}

interface CustomEditorParams extends ICellEditorParams {
  options?: OptionType[];
}

const icon = (
  <CheckBoxOutlineBlankIcon fontSize="small" style={{ color: '#666' }} />
);
const checkedIcon = <CheckBoxIcon fontSize="small" color="primary" />;

const Renderer = (props: CustomCellRendererProps) => {
  const values: OptionType[] = props.value;
  const [cellWidth, setCellWidth] = useState(
    props.eParentOfValue ? props.eParentOfValue.clientWidth : 0,
  );

  useEffect(() => {
    if (!props.eParentOfValue) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCellWidth(entry.contentRect.width);
      }
    });
    observer.observe(props.eParentOfValue);
    return () => observer.disconnect();
  }, [props.eParentOfValue]);

  if (!values || !Array.isArray(values) || values.length === 0) {
    return null;
  }

  const availableWidth = cellWidth - 40;
  let currentWidth = 0;
  let visibleCount = 0;

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (context) context.font = '12px Roboto, sans-serif';

  for (let i = 0; i < values.length; i++) {
    const label = values[i].label;
    const itemWidth =
      (context ? context.measureText(label).width : label.length * 7) + 20;
    currentWidth += itemWidth + 2;

    if (currentWidth < availableWidth) {
      visibleCount++;
    } else {
      break;
    }
  }

  if (visibleCount === 0 && values.length > 0 && availableWidth > 20)
    visibleCount = 1;
  if (visibleCount < values.length) {
    visibleCount = Math.max(0, visibleCount);
  }

  const visibleItems = values.slice(0, visibleCount);
  const hiddenCount = values.length - visibleCount;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        height: '100%',
        paddingLeft: '5px',
        overflow: 'hidden',
      }}
    >
      {visibleItems.map((item, idx) => (
        <div
          key={idx}
          style={{
            backgroundColor: '#90caf9',
            color: '#000',
            borderRadius: '4px',
            padding: '2px 6px',
            fontSize: '12px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            whiteSpace: 'nowrap',
            maxWidth: '120px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={item.label}
        >
          {item.label}
        </div>
      ))}

      {hiddenCount > 0 && (
        <span
          style={{
            fontSize: '11px',
            color: '#666',
            cursor: 'help',
            whiteSpace: 'nowrap',
            fontWeight: 'bold',
          }}
          title={values
            .slice(visibleCount)
            .map((v) => v.label)
            .join(', ')}
        >
          +{hiddenCount}
        </span>
      )}
    </div>
  );
};

const Editor = memo((props: CustomEditorParams) => {
  const allOptions = props.options || [];
  const colId = props.column.getColId();

  const [selectedItems, setSelectedItems] = useState<OptionType[]>(
    props.value || [],
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [popupMaxHeight, setPopupMaxHeight] = useState<number>(400);
  const inputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    const gridElement = props.eGridCell.closest(
      '.ag-root-wrapper',
    ) as HTMLElement;

    const targetElement =
      gridElement || document.querySelector('.ag-root-wrapper');

    if (targetElement) {
      const gridHeight = targetElement.clientHeight;
      const calculatedHeight = Math.max(150, gridHeight - 100);
      setPopupMaxHeight(calculatedHeight);
    }
  }, [props.eGridCell]);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const saveData = (newSelected: OptionType[]) => {
    props.node.setDataValue(colId, newSelected);
  };

  const toggleItem = (item: OptionType) => {
    const isSelected = selectedItems.some((i) => i.id === item.id);
    let newSelected;
    if (isSelected) {
      newSelected = selectedItems.filter((i) => i.id !== item.id);
    } else {
      newSelected = [...selectedItems, item];
    }
    setSelectedItems(newSelected);
    saveData(newSelected);
  };

  const removeItem = (itemToRemove: OptionType) => {
    const newSelected = selectedItems.filter((i) => i.id !== itemToRemove.id);
    setSelectedItems(newSelected);
    saveData(newSelected);
  };

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return allOptions;
    return allOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opt.id.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [allOptions, searchTerm]);

  return (
    <div
      className="ag-custom-editor-popup"
      style={{
        width: 320,
        backgroundColor: 'white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        borderRadius: '8px',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        border: '1px solid #e0e0e0',
        maxHeight: `${popupMaxHeight}px`,
      }}
    >
      {/* 1. SEARCH INPUT */}
      <div style={{ flexShrink: 0 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          inputRef={inputRef}
          InputProps={{
            style: { fontSize: '14px', borderRadius: '6px' },
            endAdornment: searchTerm && (
              <IconButton size="small" onClick={() => setSearchTerm('')}>
                <CloseIcon fontSize="small" />
              </IconButton>
            ),
          }}
        />
      </div>

      {selectedItems.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            flexShrink: 0,
          }}
        >
          {selectedItems.map((item) => (
            <div
              key={item.id}
              style={{
                border: '1px solid #ccc',
                borderRadius: '16px',
                padding: '2px 8px',
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'white',
                fontSize: '13px',
                gap: '4px',
                color: '#333',
              }}
            >
              {item.id}
              <div
                role="button"
                tabIndex={0}
                aria-label={`Remove ${item.label}`}
                onClick={() => removeItem(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    removeItem(item);
                  }
                }}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <CloseIcon
                  style={{ fontSize: 14, cursor: 'pointer', color: '#666' }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          fontSize: '12px',
          color: '#666',
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        Total {filteredOptions.length}
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0,
          borderTop: '1px solid #f0f0f0',
          marginTop: '-5px',
        }}
        role="listbox"
      >
        {filteredOptions.map((option) => {
          const isSelected = selectedItems.some((i) => i.id === option.id);
          return (
            <div
              key={option.id}
              onClick={() => toggleItem(option)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleItem(option);
                }
              }}
              tabIndex={0}
              role="option"
              aria-selected={isSelected}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '6px 4px',
                cursor: 'pointer',
                backgroundColor: isSelected ? '#f5f5f5' : 'transparent',
                transition: 'background 0.2s',
                outline: 'none',
              }}
              className="hover:bg-gray-50 focus:bg-gray-100"
            >
              <Checkbox
                checked={isSelected}
                icon={icon}
                checkedIcon={checkedIcon}
                style={{ padding: '4px 8px' }}
                size="small"
                tabIndex={-1}
                disableRipple
              />

              <div
                style={{
                  backgroundColor: '#90caf9',
                  color: '#000',
                  borderRadius: '12px',
                  padding: '2px 10px',
                  fontSize: '13px',
                  fontWeight: 500,
                  minWidth: '60px',
                  textAlign: 'center',
                }}
              >
                {option.label}
              </div>
            </div>
          );
        })}

        {filteredOptions.length === 0 && (
          <div
            style={{
              padding: '10px',
              textAlign: 'center',
              color: '#999',
              fontSize: '13px',
            }}
          >
            No options found
          </div>
        )}
      </div>
    </div>
  );
});

Editor.displayName = 'AgMultiSelectCellEditor';

export const AgMultiSelectCell = {
  Renderer,
  Editor,
};
