import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { ICellEditorParams } from 'ag-grid-community';
import {
  Box,
  Paper,
  TextField,
  InputAdornment,
  IconButton,
  Typography,
  Divider,
  List,
  ListItemButton,
  Chip,
} from '@mui/material';
import { Cancel } from '@mui/icons-material';

import AgGridCellRender from './AgGridCellRender';

import { CommonUdcInput, CommonUdcOutput } from '@/lib/types/commonCode';
import useCommonUdcs from '@/hooks/useBizDatas';
import { useDebounce } from '@/hooks/useDebounce';

/* ========================================================= */

export interface PaperAgGridParams extends ICellEditorParams, CommonUdcInput {
  is_display_chip: boolean;

  /** Custom select handler from columnDefs */
  handleSelect?: (args: {
    item: CommonUdcOutput;
    props: ICellEditorParams;
    setValue: React.Dispatch<React.SetStateAction<any>>;
  }) => void;
}

/* ========================================================= */

const PaperAgGrid = forwardRef<unknown, PaperAgGridParams>((props, ref) => {
  const [value, setValue] = useState(props.value || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [isNearBottom, setIsNearBottom] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Use custom hook for program data management with dataType
  const { bizDatas, totalCount, isLoading, searchDatas, clearDatas } =
    useCommonUdcs({ bizKey: props.bizKey });

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPositionCalculated, setIsPositionCalculated] = useState(false);
  const [maxListHeight, setMaxListHeight] = useState(250);

  // Sync focused index with results size
  useEffect(() => {
    setFocusedIndex(0);
  }, [bizDatas]);

  /* ---------- AG Grid popup contract ---------- */
  useImperativeHandle(ref, () => ({
    getValue() {
      return value;
    },
    isPopup() {
      return true;
    },
    afterGuiAttached() {
      setTimeout(() => inputRef.current?.focus(), 0);
    },
  }));

  /* ---------- Auto focus ---------- */
  useEffect(() => {
    // Fallback focus attempt
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  /* ---------- Detect position ONCE on mount ---------- */
  useEffect(() => {
    // eGridCell is the direct DOM element of the cell being focused/edited (highly accurate)
    const cellElement = props.eGridCell || containerRef.current;
    if (!cellElement) return;

    // Use requestAnimationFrame to ensure DOM is fully rendered
    const rafId = requestAnimationFrame(() => {
      const targetElement = props.eGridCell || containerRef.current;
      if (!targetElement) return;

      const cellRect = targetElement.getBoundingClientRect();

      let gridContainer = null;

      // 1. Attempt to use Grid API to get the root grid division element
      if (props.api) {
        gridContainer = (props.api as any).eGridDiv;

        if (!gridContainer) {
          gridContainer = (props.api as any).gridBodyCtrl?.eBodyViewport;
        }
      }

      // 2. Fallback: search relative to the cell element for the root wrapper
      if (!gridContainer && props.eGridCell) {
        gridContainer =
          props.eGridCell.closest('.ag-root-wrapper') ||
          props.eGridCell.closest('.ag-root') ||
          props.eGridCell.closest('.ag-body-viewport');
      }

      // 3. Fallback: search relative to container ref or DOM query
      if (!gridContainer && containerRef.current) {
        gridContainer =
          containerRef.current.closest('.ag-root-wrapper') ||
          containerRef.current.closest('.ag-root') ||
          containerRef.current.closest('.ag-body-viewport') ||
          containerRef.current.closest('.ag-center-cols-viewport') ||
          document.querySelector('.ag-root-wrapper') ||
          document.querySelector('.ag-body-viewport');
      }

      // Mathematical layout formula: yellow (popup) = red (grid wrapper) - green (focused cell)
      // Precise overhead calculation:
      // - Search Box Height: p: 2 (16px top padding) + TextField (30px) = 46px
      // - Total Section Height: px: 2, py: 1 (16px padding top/bottom) + Typography (18px) = 34px
      // - Divider Height: 1px
      // - Non-scrollable fixed height = 46 + 34 + 1 = 81px
      // - Positioning offset = 4px (calc(100% + 4px))
      // Total overhead from cell edge to popup edge = 81 + 4 = 85px
      const FIXED_OVERHEAD = 85;

      let spaceBelow = 0;
      let spaceAbove = 0;

      if (gridContainer) {
        const gridRect = gridContainer.getBoundingClientRect();

        // Implementing formula: height available = grid height - cell y position - cell height
        const gridHeight = gridRect.height;
        const cellYPosition = cellRect.top - gridRect.top; // Relative Y position of the cell inside the grid wrapper
        const cellHeight = cellRect.height;

        spaceBelow = gridHeight - (cellYPosition + cellHeight);
        spaceAbove = cellYPosition; // FIX: correct calculation to not include cellHeight in spaceAbove
      } else {
        spaceBelow = window.innerHeight - cellRect.bottom;
        spaceAbove = cellRect.top;
      }

      // Flip upwards if there's more space above than below
      const shouldFlip = spaceAbove > spaceBelow;

      // Calculate max height for list based on available space
      const availableSpace = shouldFlip ? spaceAbove : spaceBelow;
      const calculatedMaxHeight = Math.max(
        50, // FIX: Minimum height of 100px to ensure list remains usable even in very tight viewports
        availableSpace - FIXED_OVERHEAD,
      );
      const finalMaxHeight = Math.min(100, calculatedMaxHeight); // FIX: Cap list height at 250px for design aesthetics

      setIsNearBottom(shouldFlip);
      setMaxListHeight(finalMaxHeight);
      setIsPositionCalculated(true);
    });

    // Safety fallback: ensure it becomes visible event if calculation fails
    const safetyTimer = setTimeout(() => setIsPositionCalculated(true), 100);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(safetyTimer);
    };
  }, [props.api, props.eGridCell]);

  /* ---------- Debounced Search ---------- */
  // Debounce search term to avoid too many API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const {
    bizType,
    bizKey,
    bizModule,
    biz01,
    biz02,
    biz03,
    biz04,
    biz05,
    biz06,
    biz07,
    biz08,
    biz09,
    biz10,
    obj01,
    obj02,
    obj03,
    obj04,
    obj05,
    obj06,
    obj07,
    obj08,
    obj09,
    obj10,
  } = props;

  /* ---------- Async Search Effect ---------- */
  useEffect(() => {
    if (!debouncedSearchTerm) {
      clearDatas();
      return;
    }

    // Call the hook's searchDatas function
    searchDatas({
      bizType,
      bizKey,
      bizModule,
      biz01: debouncedSearchTerm,
      biz02,
      biz03,
      biz04,
      biz05,
      biz06,
      biz07,
      biz08,
      biz09,
      biz10,

      obj01,
      obj02,
      obj03,
      obj04,
      obj05,
      obj06,
      obj07,
      obj08,
      obj09,
      obj10,
    }).catch((error: any) => {
      console.error('Search failed:', error);
    });
  }, [
    debouncedSearchTerm,
    searchDatas,
    clearDatas,
    bizType,
    bizKey,
    bizModule,
    biz01,
    biz02,
    biz03,
    biz04,
    biz05,
    biz06,
    biz07,
    biz08,
    biz09,
    biz10,
    obj01,
    obj02,
    obj03,
    obj04,
    obj05,
    obj06,
    obj07,
    obj08,
    obj09,
    obj10,
  ]);

  const onSelect = (item: CommonUdcOutput) => {
    if (props.handleSelect) {
      props.handleSelect({ item, props, setValue });
    } else {
      setValue(item);
      props.api?.stopEditing(true);
    }
  };

  /* ---------- Keyboard Navigation ---------- */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (bizDatas.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex((prev: number) => (prev + 1) % bizDatas.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(
        (prev: number) => (prev - 1 + bizDatas.length) % bizDatas.length,
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selectedItem = bizDatas[focusedIndex];
      if (selectedItem) {
        onSelect(selectedItem);
      }
    } else if (e.key === 'Escape') {
      props.api?.stopEditing(true);
    }
  };

  /* ---------- Highlight ---------- */
  const highlightText = (text: string, highlight: string) => {
    if (!highlight) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <Box
              key={i}
              component="span"
              sx={{ color: 'primary.main', fontWeight: 500 }}
            >
              {part}
            </Box>
          ) : (
            part
          ),
        )}
      </>
    );
  };

  /* ---------------- Render ---------------- */

  return (
    <Box
      ref={containerRef}
      onKeyDown={handleKeyDown}
      sx={{
        position: 'relative',
        // Use column width as the primary source of truth for stability
        width: props.column
          ? props.column.getActualWidth()
          : props.eGridCell?.offsetWidth || 400,
        height: props.eGridCell ? props.eGridCell.offsetHeight : '100%',
        fontFamily: 'Roboto, sans-serif',
        fontSize: '14px',
      }}
    >
      {/* ===== Anchor ===== */}
      <AgGridCellRender
        displayName={value}
        mode="editor"
        is_place_holder={true}
        is_display_chip={props.is_display_chip}
        value01={props.data.value01}
        value02={props.data.value02}
        value03={props.data.value03}
      />

      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          left: 0,
          right: 0,
          ...(isNearBottom
            ? { bottom: 'calc(100% + 4px)' }
            : { top: 'calc(100% + 4px)' }),

          backgroundColor: 'white',
          borderRadius: 2,
          border: '1px solid #e0e0e0',
          zIndex: 20,

          display: 'flex',
          flexDirection: 'column',
          // Hide until position is calculated to prevent flicker
          opacity: isPositionCalculated ? 1 : 0,
          visibility: isPositionCalculated ? 'visible' : 'hidden',
          transition: 'opacity 0.1s ease-in',
        }}
      >
        {/* ===== SEARCH (always on top) ===== */}
        <Box sx={{ p: 2, pb: 0 }}>
          <TextField
            inputRef={inputRef}
            size="small"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                height: 30,
                borderRadius: 1.5, // rounded corners
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main', // Focus color
                  borderWidth: 2,
                },
                '& fieldset': {
                  borderColor: '#bdbdbd',
                },
              },
            }}
            InputProps={{
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setSearchTerm('')}
                    sx={{
                      p: 0.5,
                      '&:hover': { backgroundColor: 'transparent' },
                    }}
                    disableRipple
                  >
                    <Cancel sx={{ color: '#B5BED7', fontSize: 18 }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* ===== TOTAL ===== */}
        <Box
          sx={{
            px: 2,
            py: 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: '#757575', fontSize: '13px' }}
          >
            Total{' '}
            <span style={{ fontWeight: 'bold', color: '#000' }}>
              {totalCount}
            </span>
          </Typography>
        </Box>

        <Divider sx={{ borderColor: '#f0f0f0' }} />

        {/* ===== LIST ===== */}
        <List
          disablePadding
          sx={{
            maxHeight: maxListHeight,
            overflowY: 'scroll', // Always show scrollbar
          }}
        >
          {isLoading ? (
            <Box
              sx={{
                height: '100%',
                minHeight: maxListHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                fontStyle: 'italic',
                fontSize: '14px',
              }}
            >
              Searching...
            </Box>
          ) : (
            <>
              {bizDatas.map((item: CommonUdcOutput, index: number) => (
                <ListItemButton
                  key={`${item.value01}-${index}`}
                  onClick={() => onSelect(item)}
                  selected={index === focusedIndex || item.value01 === value}
                  sx={{
                    px: 2,
                    py: 0.75,
                    '&.Mui-selected': {
                      backgroundColor: '#F3F4F6', // Light grey for selection
                      '&:hover': {
                        backgroundColor: '#E5E7EB',
                      },
                    },
                    '&:hover': {
                      backgroundColor: '#F9FAFB',
                    },
                  }}
                >
                  {props.is_display_chip && (
                    <Chip
                      label={item.value03 || item.value01}
                      size="small"
                      sx={{
                        mr: 1.5,
                        minWidth: 80,
                        height: 24,
                        backgroundColor: '#EBEFF5', // Matches the bluish-grey in image
                        color: '#344054', // Dark grey text
                        fontWeight: 600,
                        // borderRadius: '6px', // Rounded rect
                        fontSize: '12px',
                        '& .MuiChip-label': {
                          px: 1,
                        },
                      }}
                    />
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: '#101828',
                    }}
                  >
                    {highlightText(item.value02, searchTerm)}
                  </Typography>
                </ListItemButton>
              ))}

              {bizDatas.length === 0 && (
                <Box
                  sx={{
                    height: '100%',
                    minHeight: maxListHeight,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9e9e9e',
                    fontSize: '14px',
                  }}
                >
                  {searchTerm
                    ? 'No results found'
                    : 'Search and find the word you want'}
                </Box>
              )}
            </>
          )}
        </List>
      </Paper>
    </Box>
  );
});

PaperAgGrid.displayName = 'PaperAgGrid';
export default PaperAgGrid;
