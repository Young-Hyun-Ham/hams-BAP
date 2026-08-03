'use client';

import { themeQuartz } from 'ag-grid-community';
import { format } from 'date-fns';

import ActiveEditor from '../../components/grid/StatusEditor';
import ActiveBadgeRenderer from '../../components/grid/StatusBadgeRenderer';
import {
  rangeSelectionCellClassRules,
  rangeSelectionHandlers,
} from './rangeSelection';

import type {
  GridOptions,
  ColDef,
  ValueFormatterParams,
  CellStyle,
} from 'ag-grid-community';

import RadioCellRenderer from '@/components/grid/RadioCellRenderer';
import { CustomNoRowsOverlay } from '@/components/grid/CustomNoRowsOverlay';
import DeleteButtonRenderer from '@/components/grid/DeleteButtonRenderer';
import { RadioGroupRenderer } from '@/components/common/RadioGroupRenderer';
import { AgMultiSelectCell } from '@/components/grid/MultiSelect';
import SelectBoxCellRenderer from '@/components/grid/SelectBoxCellRenderer';
import SelectBoxCellEditor from '@/components/grid/SelectBoxCellEditor';
import RangeCellEditor from '@/components/grid/RangeCellEditor';
import RangeCellRenderer from '@/components/grid/RangeCellRenderer';
import ChipCellRenderer from '@/components/grid/ChipCellRenderer';
import SwitchCellRenderer from '@/components/grid/SwitchCellRenderer';
import SelectAndTextCellRenderer from '@/components/grid/SelectAndTextCellRenderer';

/**
 * Extended ColDef to support required field validation
 */
declare module 'ag-grid-community' {
  export interface ColDef {
    /**
     * If true, this field is required and must have a non-empty value
     * - Displays an asterisk (*) in the header
     * - Can be validated using validateRequiredFields function
     */
    required?: boolean;
  }
}

export const columnTypes: { [key: string]: ColDef } = {
  // 날짜 컬럼
  dateColumn: {
    filter: 'agDateColumnFilter',
    cellDataType: 'dateString',
    filterParams: {
      comparator: (filterDate: Date, cellValue: string) => {
        if (!cellValue) return -1;
        const cellDate = new Date(cellValue);
        if (cellDate < filterDate) return -1;
        if (cellDate > filterDate) return 1;
        return 0;
      },
    },
    valueFormatter: (params: ValueFormatterParams) => {
      if (!params.value) return '';
      const date = new Date(params.value);
      if (isNaN(date.getTime())) return params.value;
      return format(date, 'yyyy-MM-dd');
    },
  },
  dateTimeColumn: {
    filter: 'agDateColumnFilter',
    cellDataType: 'dateString',
    filterParams: {
      comparator: (filterDate: Date, cellValue: string) => {
        if (!cellValue) return -1;
        const cellTime = new Date(cellValue).getTime();
        const filterTime = filterDate.getTime();
        return cellTime < filterTime ? -1 : cellTime > filterTime ? 1 : 0;
      },
    },
    valueFormatter: ({ value }: ValueFormatterParams) => {
      if (!value) return '';
      const date = new Date(value);
      if (isNaN(date.getTime())) return value;
      return format(date, 'yyyy-MM-dd HH:mm:ss');
    },
  },

  // 숫자 컬럼
  numberColumn: {
    filter: 'agNumberColumnFilter',
    valueFormatter: (params: ValueFormatterParams) => {
      if (params.value == null) return '';
      return params.value.toLocaleString();
    },
    cellStyle: { textAlign: 'right' },
  },

  // 통화 컬럼
  currencyColumn: {
    filter: 'agNumberColumnFilter',
    valueFormatter: (params: ValueFormatterParams) => {
      if (params.value == null) return '';
      return `₩${params.value.toLocaleString()}`;
    },
    cellStyle: { textAlign: 'right' },
  },

  // 체크박스 컬럼
  checkboxColumn: {
    cellRenderer: 'agCheckboxCellRenderer',
    cellEditor: 'agCheckboxCellEditor',
    // filter: 'agSetColumnFilter', //Enterprise Feature
    filterParams: {
      valueFormatter: (params: any) => (params.value ? '예' : '아니오'),
    },
  },

  // 셀렉트박스 컬럼 (각 화면에서 values 지정 필요)
  selectColumn: {
    cellRenderer: SelectBoxCellRenderer,
    cellEditor: SelectBoxCellEditor,
    // filter: 'agSetColumnFilter', //Enterprise Feature
    cellEditorPopup: true,
    cellStyle: {
      padding: 0,
    } as CellStyle,
  },

  radioColumn: {
    width: 220,
    sortable: false,
    cellRenderer: RadioGroupRenderer,
    suppressHeaderMenuButton: true,
    cellStyle: { display: 'flex', alignItems: 'center' },
  },

  singleRadioColumn: {
    field: 'row_selected',
    cellRenderer: RadioCellRenderer,
    width: 50,
    minWidth: 50,
    maxWidth: 50,
    sortable: false,
    filter: false,
    resizable: false,
    headerName: '',
    pinned: 'left',
    cellStyle: { padding: 0 } as CellStyle,
    editable: false,
    suppressHeaderMenuButton: true,
  },

  multiSelectColumn: {
    width: 250,
    sortable: false,
    filter: false,

    // Renderer (View Mode)
    cellRenderer: AgMultiSelectCell.Renderer,

    // Editor (Edit Mode)
    editable: true,
    cellEditor: AgMultiSelectCell.Editor,
    cellEditorPopup: true,
    cellEditorPopupPosition: 'under',

    // Config behavior
    singleClickEdit: true,
  },
  deleteIcon: {
    width: 30,
    sortable: false,
    filter: false,
    resizable: false,
    cellRenderer: DeleteButtonRenderer,
    headerClass: 'ag-center-header',
  },
  actionStatus: {
    width: 130,
    cellRenderer: ActiveBadgeRenderer,
    editable: true,
    cellEditor: ActiveEditor,
    cellEditorPopup: true,
    sortable: false,
    cellStyle: {
      padding: 0,
    } as CellStyle,
  },
  /**
   * Range Type - allows selecting a numeric range (From - To)
   */
  range: {
    cellEditor: RangeCellEditor,
    cellRenderer: RangeCellRenderer,
    editable: true,
    cellStyle: { padding: 0 } as CellStyle,
    suppressKeyboardEvent: (params: any) => {
      const event = params.event;
      // Prevent AG Grid from swallowing Enter, Tab, and Escape so the editor can handle them
      if (
        event.key === 'Enter' ||
        event.key === 'Tab' ||
        event.key === 'Escape'
      ) {
        return true;
      }
      return false;
    },
    valueFormatter: (params) => {
      const val = params.value;
      if (!val || typeof val !== 'object') return '';
      const { from_val, to_val } = val;
      if (from_val == null && to_val == null) return '';
      if (from_val != null && to_val == null) return `${from_val} ~ ...`;
      if (from_val == null && to_val != null) return `... ~ ${to_val}`;
      return `${from_val} ~ ${to_val}`;
    },
  },
  chipCell: {
    width: 150,
    editable: false,
    cellRenderer: ChipCellRenderer,
  },
  switchCell: {
    width: 110,
    cellRenderer: SwitchCellRenderer,
    editable: false,
    sortable: false,
  },
  selectAndTextCell: {
    minWidth: 350,
    autoHeight: true,
    cellRenderer: SelectAndTextCellRenderer,
    editable: false,
    sortable: false,
  },
};

/**
 * Default Grid Theme (Quartz)
 */
export const defaultGridTheme = themeQuartz.withParams({
  columnBorder: false,
  wrapperBorder: false,
});

/**
 * AG Grid 기본 옵션 설정
 * 각 화면에서 이 설정을 기반으로 커스터마이징 가능
 */
export const defaultGridOptions: GridOptions = {
  get context() {
    return {};
  },
  // 페이지네이션 기본 설정
  pagination: false,
  paginationPageSize: 50, // 기본 50개
  paginationPageSizeSelector: [10, 20, 50, 100, 200],

  // 행 선택 설정
  rowSelection: {
    mode: 'singleRow',
    checkboxes: false,
    enableClickSelection: true,
  },
  rowDragManaged: false,
  enableRowPinning: true,

  readOnlyEdit: false,
  singleClickEdit: false,
  stopEditingWhenCellsLoseFocus: false,
  suppressClickEdit: false,
  suppressStartEditOnTab: false,
  invalidEditValueMode: 'revert',

  // Cell focus is visually suppressed via CSS (globals.css) instead of
  // suppressCellFocus: true, which breaks Shift+Click by causing full-row border.
  suppressCellFocus: false,

  // 애니메이션
  animateRows: true,

  // 기본 컬럼 설정
  defaultColDef: {
    resizable: true, // 컬럼 크기 조정 가능
    sortable: true, // 정렬 기본 활성화
    filter: false, // 필터 기본 비활성화
    editable: false, // 편집 기본 비활성화
    floatingFilter: false, // 플로팅 필터 기본 비활성화
    minWidth: 100,
    autoHeaderHeight: true,
    wrapHeaderText: false,

    // Automatically apply 'required-header' CSS class for columns with required: true or context.required: true
    // This adds the red asterisk (*) via CSS ::after pseudo-element
    headerClass: (params) => {
      const colDef = params.colDef as ColDef;
      const isRequired = colDef.required || colDef.context?.required;
      return isRequired ? 'required-header' : '';
    },
    //Automatic visual validation for required fields
    cellClassRules: {
      'ag-invalid-cell': (params) => {
        // Return true to apply class if required AND empty
        const isRequired =
          params.colDef.required || params.colDef.context?.required;
        if (!isRequired) return false;
        const value = params.value;
        return (
          value === null ||
          value === undefined ||
          (typeof value === 'string' && value.trim() === '')
        );
      },
      'cell-disabled': (params) => {
        // Default is true (show background), only skip if explicitly set to false
        if (params.context?.highlightReadOnly === false) return false;

        // Determine if the cell is editable
        let isEditable = params.colDef.editable;

        // If it's a function, execute it
        if (typeof isEditable === 'function') {
          isEditable = isEditable(params);
        }

        // Return true (apply class) if NOT editable
        return !isEditable;
      },
      ...rangeSelectionCellClassRules,
    },
  },

  suppressMovableColumns: false, //suppress column moving
  suppressColumnMoveAnimation: false, //suppress animation column moving
  suppressDragLeaveHidesColumns: true, //when you drag a column out of the grid (e.g. to the group zone) the column is not hidden.
  hidePaddedHeaderRows: true, //When using column groups the grid adds padding to columns to ensure the column tree is balanced.

  // Excel 내보내기 설정
  defaultExcelExportParams: {
    fileName: 'export.xlsx',
    sheetName: 'Sheet1',
  },

  // 기타 설정
  cellSelection: false, // 범위 선택 가능
  enableCellTextSelection: false, // 셀 텍스트 선택 및 복사 가능
  ensureDomOrder: true, // 텍스트 드래그 선택 시 DOM 순서 보장
  suppressMenuHide: true, // 메뉴 항상 표시
  rowHeight: 30, // 행 높이
  headerHeight: 32,

  undoRedoCellEditing: true,
  undoRedoCellEditingLimit: 10,

  cacheQuickFilter: false,

  includeHiddenColumnsInQuickFilter: false,
  columnTypes: columnTypes,

  theme: defaultGridTheme,

  ...rangeSelectionHandlers,

  // Custom Overlays
  noRowsOverlayComponent: CustomNoRowsOverlay,
};

/**
 * 컬럼 타입별 기본 설정
 */
interface RowData {
  tags: string[];
}

/**
 * 필수 값 검증을 위한 Cell Class Rules
 */
export const requiredCellClassRules = {
  'cell-required-empty': (params: any) => {
    return !params.value || params.value === '';
  },
};

/**
 * 셀 스타일 (필수 값 표시용)
 */
export const cellStyleRequired = {
  position: 'relative' as const,
};
