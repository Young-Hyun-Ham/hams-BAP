'use client';

// Module-level state to track the active grid for global copy/keyboard handling when suppressCellFocus: true is active
let activeGridApi: any = null;
let activeGridContext: any = null;
let isGlobalKeyDownRegistered = false;

let isShiftPressed = false;
let isCtrlPressed = false;

if (typeof window !== 'undefined') {
  const updateKeyStates = (e: KeyboardEvent, isDown: boolean) => {
    if (e.key === 'Shift') isShiftPressed = isDown;
    if (e.key === 'Control' || e.key === 'Meta') isCtrlPressed = isDown;
  };
  window.addEventListener('keydown', (e) => updateKeyStates(e, true));
  window.addEventListener('keyup', (e) => updateKeyStates(e, false));
  window.addEventListener('blur', () => {
    isShiftPressed = false;
    isCtrlPressed = false;
  });
}

const handleGlobalKeyDown = (event: KeyboardEvent) => {
  if (
    activeGridApi &&
    typeof activeGridApi.isDestroyed === 'function' &&
    activeGridApi.isDestroyed()
  ) {
    activeGridApi = null;
    activeGridContext = null;
  }

  const isCopy =
    (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c';
  if (isCopy) {
    // Avoid hijacking copy inside inputs, textareas or contenteditable zones
    const activeEl = document.activeElement;
    if (activeEl) {
      const tagName = activeEl.tagName.toLowerCase();
      if (
        tagName === 'input' ||
        tagName === 'textarea' ||
        activeEl.hasAttribute('contenteditable')
      ) {
        return;
      }
    }

    if (!activeGridApi || !activeGridContext) return;

    const state = activeGridContext.customRangeSelectionState;
    if (!state || !state.ranges || state.ranges.length === 0) return;

    event.preventDefault();
    copyRangesToClipboard(state, activeGridApi, activeGridContext);
  }

  if (event.key === 'Escape') {
    if (activeGridContext?.customRangeSelectionState) {
      console.log('Range selection cleared via Escape');
      activeGridContext.customRangeSelectionState = null;
      if (
        activeGridApi &&
        typeof activeGridApi.isDestroyed === 'function' &&
        !activeGridApi.isDestroyed()
      ) {
        activeGridApi.refreshCells({ force: true });
      }
    }
  }

  if (event.key === ' ' || event.code === 'Space') {
    // Avoid hijacking space inside inputs, textareas or contenteditable zones
    const activeEl = document.activeElement;
    if (activeEl) {
      const tagName = activeEl.tagName.toLowerCase();
      if (
        tagName === 'input' ||
        tagName === 'textarea' ||
        activeEl.hasAttribute('contenteditable')
      ) {
        return;
      }
    }

    if (activeGridApi) {
      const focusedCell = activeGridApi.getFocusedCell();
      if (focusedCell) {
        setTimeout(() => {
          try {
            activeGridApi.setFocusedCell(
              focusedCell.rowIndex,
              focusedCell.column.getColId(),
            );
          } catch (err) {
            // Ignore
          }
        }, 50);
      }
    }
  }
};

const handleGlobalMouseDown = (event: MouseEvent) => {
  if (
    activeGridApi &&
    typeof activeGridApi.isDestroyed === 'function' &&
    activeGridApi.isDestroyed()
  ) {
    activeGridApi = null;
    activeGridContext = null;
  }

  if (!activeGridApi || !activeGridContext) return;

  const state = activeGridContext.customRangeSelectionState;
  if (!state) return;

  const target = event.target as HTMLElement | null;
  if (target) {
    // If click is inside the active grid or another grid container, do not clear
    if (target.closest('.ag-root-wrapper')) {
      return;
    }
  }

  console.log('Clicked outside grid, clearing range selection');
  activeGridContext.customRangeSelectionState = null;
  if (
    activeGridApi &&
    typeof activeGridApi.isDestroyed === 'function' &&
    !activeGridApi.isDestroyed()
  ) {
    activeGridApi.refreshCells({ force: true });
  }

  activeGridApi = null;
  activeGridContext = null;
};

/**
 * Custom Cell Class Rules for Range Selection styling
 */
/**
 * Helper to update columnIds array in range selection
 */
const updateRangeColumnIds = (range: any, api: any) => {
  const allColumns = api.getAllDisplayedColumns();
  if (!allColumns) return;

  const startColIdx = allColumns.findIndex(
    (c: any) => c.getColId() === range.startCell.columnId,
  );
  const endColIdx = allColumns.findIndex(
    (c: any) => c.getColId() === range.endCell.columnId,
  );

  if (startColIdx !== -1 && endColIdx !== -1) {
    const minColIdx = Math.min(startColIdx, endColIdx);
    const maxColIdx = Math.max(startColIdx, endColIdx);
    const cols = allColumns.slice(minColIdx, maxColIdx + 1);
    range.columnIds = cols.map((c: any) => c.getColId());
  } else {
    range.columnIds = [range.startCell.columnId];
  }
};

/**
 * Clean up smaller ranges that are completely enclosed by another selected range
 */
const cleanupEnclosedRanges = (state: any, api: any) => {
  if (!state || !state.ranges || state.ranges.length <= 1) return;

  const allColumns = api.getAllDisplayedColumns();
  if (!allColumns) return;

  // Pre-calculate full bounds of all ranges
  const boundsList = state.ranges.map((range: any) => {
    const startRow = Math.min(range.startCell.rowIndex, range.endCell.rowIndex);
    const endRow = Math.max(range.startCell.rowIndex, range.endCell.rowIndex);

    let cols = range.columnIds || [];
    if (cols.length === 0) {
      const startColIdx = allColumns.findIndex(
        (c: any) => c.getColId() === range.startCell.columnId,
      );
      const endColIdx = allColumns.findIndex(
        (c: any) => c.getColId() === range.endCell.columnId,
      );
      if (startColIdx !== -1 && endColIdx !== -1) {
        const minIdx = Math.min(startColIdx, endColIdx);
        const maxIdx = Math.max(startColIdx, endColIdx);
        cols = allColumns
          .slice(minIdx, maxIdx + 1)
          .map((c: any) => c.getColId());
      } else {
        cols = [range.startCell.columnId];
      }
    }

    return {
      range,
      startRow,
      endRow,
      columnIds: cols,
      area: (endRow - startRow + 1) * cols.length,
    };
  });

  const rangesToKeep: any[] = [];

  for (let i = 0; i < boundsList.length; i++) {
    const b1 = boundsList[i];
    let isEnclosed = false;

    for (let j = 0; j < boundsList.length; j++) {
      if (i === j) continue;
      const b2 = boundsList[j];

      // Check if b1 is entirely inside b2, and b1's area is smaller or equal
      const isRowInside = b1.startRow >= b2.startRow && b1.endRow <= b2.endRow;
      const isColInside = b1.columnIds.every((id: string) =>
        b2.columnIds.includes(id),
      );

      if (isRowInside && isColInside) {
        // If areas are equal, only remove one of them (keep the one with smaller index)
        if (b1.area < b2.area || (b1.area === b2.area && i > j)) {
          isEnclosed = true;
          break;
        }
      }
    }

    if (!isEnclosed) {
      rangesToKeep.push(b1.range);
    }
  }

  if (rangesToKeep.length !== state.ranges.length) {
    console.log(
      `Cleaned up enclosed ranges. Reduced count from ${state.ranges.length} to ${rangesToKeep.length}`,
    );
    state.ranges = rangesToKeep;
    state.activeRangeIndex = Math.max(0, state.ranges.length - 1);
    api.refreshCells({ force: true });
  }
};

/**
 * Custom Cell Class Rules for Range Selection styling
 */
export const rangeSelectionCellClassRules = {
  'custom-range-selected': (params: any) => {
    const state = params.context?.customRangeSelectionState;
    if (!state || !state.ranges || state.ranges.length === 0) return false;
    const currentRowIndex = params.node.rowIndex;
    if (currentRowIndex === null || currentRowIndex === undefined) return false;

    const currentColumnId = params.column.getColId();
    const allColumns = params.api.getAllDisplayedColumns();
    if (!allColumns) return false;

    return state.ranges.some((range: any) => {
      const startRow = Math.min(
        range.startCell.rowIndex,
        range.endCell.rowIndex,
      );
      const endRow = Math.max(range.startCell.rowIndex, range.endCell.rowIndex);
      if (currentRowIndex < startRow || currentRowIndex > endRow) return false;

      if (range.columnIds) {
        return range.columnIds.includes(currentColumnId);
      }

      // Fallback
      const startColIdx = allColumns.findIndex(
        (c: any) => c.getColId() === range.startCell.columnId,
      );
      const endColIdx = allColumns.findIndex(
        (c: any) => c.getColId() === range.endCell.columnId,
      );
      if (startColIdx === -1 || endColIdx === -1) return false;
      const currentColIdx = allColumns.findIndex(
        (c: any) => c.getColId() === currentColumnId,
      );
      return (
        currentColIdx >= Math.min(startColIdx, endColIdx) &&
        currentColIdx <= Math.max(startColIdx, endColIdx)
      );
    });
  },
  'custom-range-top-edge': (params: any) => {
    const state = params.context?.customRangeSelectionState;
    if (!state || !state.ranges || state.ranges.length === 0) return false;
    const currentRowIndex = params.node.rowIndex;
    if (currentRowIndex === null || currentRowIndex === undefined) return false;

    const currentColumnId = params.column.getColId();
    const allColumns = params.api.getAllDisplayedColumns();
    if (!allColumns) return false;

    return state.ranges.some((range: any) => {
      const startRow = Math.min(
        range.startCell.rowIndex,
        range.endCell.rowIndex,
      );
      if (currentRowIndex !== startRow) return false;

      if (range.columnIds) {
        return range.columnIds.includes(currentColumnId);
      }

      // Fallback
      const startColIdx = allColumns.findIndex(
        (c: any) => c.getColId() === range.startCell.columnId,
      );
      const endColIdx = allColumns.findIndex(
        (c: any) => c.getColId() === range.endCell.columnId,
      );
      if (startColIdx === -1 || endColIdx === -1) return false;
      const currentColIdx = allColumns.findIndex(
        (c: any) => c.getColId() === currentColumnId,
      );
      return (
        currentColIdx >= Math.min(startColIdx, endColIdx) &&
        currentColIdx <= Math.max(startColIdx, endColIdx)
      );
    });
  },
  'custom-range-bottom-edge': (params: any) => {
    const state = params.context?.customRangeSelectionState;
    if (!state || !state.ranges || state.ranges.length === 0) return false;
    const currentRowIndex = params.node.rowIndex;
    if (currentRowIndex === null || currentRowIndex === undefined) return false;

    const currentColumnId = params.column.getColId();
    const allColumns = params.api.getAllDisplayedColumns();
    if (!allColumns) return false;

    return state.ranges.some((range: any) => {
      const endRow = Math.max(range.startCell.rowIndex, range.endCell.rowIndex);
      if (currentRowIndex !== endRow) return false;

      if (range.columnIds) {
        return range.columnIds.includes(currentColumnId);
      }

      // Fallback
      const startColIdx = allColumns.findIndex(
        (c: any) => c.getColId() === range.startCell.columnId,
      );
      const endColIdx = allColumns.findIndex(
        (c: any) => c.getColId() === range.endCell.columnId,
      );
      if (startColIdx === -1 || endColIdx === -1) return false;
      const currentColIdx = allColumns.findIndex(
        (c: any) => c.getColId() === currentColumnId,
      );
      return (
        currentColIdx >= Math.min(startColIdx, endColIdx) &&
        currentColIdx <= Math.max(startColIdx, endColIdx)
      );
    });
  },
  'custom-range-left-edge': (params: any) => {
    const state = params.context?.customRangeSelectionState;
    if (!state || !state.ranges || state.ranges.length === 0) return false;
    const currentRowIndex = params.node.rowIndex;
    if (currentRowIndex === null || currentRowIndex === undefined) return false;

    const currentColumnId = params.column.getColId();
    const allColumns = params.api.getAllDisplayedColumns();
    if (!allColumns) return false;
    const currentColIdx = allColumns.findIndex(
      (c: any) => c.getColId() === currentColumnId,
    );
    if (currentColIdx === -1) return false;

    const leftCol = currentColIdx > 0 ? allColumns[currentColIdx - 1] : null;
    const leftColumnId = leftCol ? leftCol.getColId() : null;

    return state.ranges.some((range: any) => {
      const startRow = Math.min(
        range.startCell.rowIndex,
        range.endCell.rowIndex,
      );
      const endRow = Math.max(range.startCell.rowIndex, range.endCell.rowIndex);
      if (currentRowIndex < startRow || currentRowIndex > endRow) return false;

      const isCurrentSelected = range.columnIds
        ? range.columnIds.includes(currentColumnId)
        : false;

      if (!isCurrentSelected) {
        if (range.columnIds) return false;
        // Fallback
        const startColIdx = allColumns.findIndex(
          (c: any) => c.getColId() === range.startCell.columnId,
        );
        const endColIdx = allColumns.findIndex(
          (c: any) => c.getColId() === range.endCell.columnId,
        );
        if (startColIdx === -1 || endColIdx === -1) return false;
        const minColIdx = Math.min(startColIdx, endColIdx);
        return currentColIdx === minColIdx;
      }

      const isLeftSelected =
        leftColumnId && range.columnIds
          ? range.columnIds.includes(leftColumnId)
          : false;

      return !isLeftSelected;
    });
  },
  'custom-range-right-edge': (params: any) => {
    const state = params.context?.customRangeSelectionState;
    if (!state || !state.ranges || state.ranges.length === 0) return false;
    const currentRowIndex = params.node.rowIndex;
    if (currentRowIndex === null || currentRowIndex === undefined) return false;

    const currentColumnId = params.column.getColId();
    const allColumns = params.api.getAllDisplayedColumns();
    if (!allColumns) return false;
    const currentColIdx = allColumns.findIndex(
      (c: any) => c.getColId() === currentColumnId,
    );
    if (currentColIdx === -1) return false;

    const rightCol =
      currentColIdx < allColumns.length - 1
        ? allColumns[currentColIdx + 1]
        : null;
    const rightColumnId = rightCol ? rightCol.getColId() : null;

    return state.ranges.some((range: any) => {
      const startRow = Math.min(
        range.startCell.rowIndex,
        range.endCell.rowIndex,
      );
      const endRow = Math.max(range.startCell.rowIndex, range.endCell.rowIndex);
      if (currentRowIndex < startRow || currentRowIndex > endRow) return false;

      const isCurrentSelected = range.columnIds
        ? range.columnIds.includes(currentColumnId)
        : false;

      if (!isCurrentSelected) {
        if (range.columnIds) return false;
        // Fallback
        const startColIdx = allColumns.findIndex(
          (c: any) => c.getColId() === range.startCell.columnId,
        );
        const endColIdx = allColumns.findIndex(
          (c: any) => c.getColId() === range.endCell.columnId,
        );
        if (startColIdx === -1 || endColIdx === -1) return false;
        const maxColIdx = Math.max(startColIdx, endColIdx);
        return currentColIdx === maxColIdx;
      }

      const isRightSelected =
        rightColumnId && range.columnIds
          ? range.columnIds.includes(rightColumnId)
          : false;

      return !isRightSelected;
    });
  },
  'custom-range-start-cell': (params: any) => {
    const state = params.context?.customRangeSelectionState;
    if (!state || !state.ranges || state.ranges.length === 0) return false;
    const activeRange = state.ranges[state.activeRangeIndex];
    if (!activeRange) return false;
    return (
      params.node.rowIndex === activeRange.startCell.rowIndex &&
      params.column.getColId() === activeRange.startCell.columnId
    );
  },
};

/**
 * Custom Grid Handlers for Range Selection
 */
export const rangeSelectionHandlers = {
  onRowSelected: (params: any) => {
    if (params.source === 'api') return;
    const focusedCell = params.api.getFocusedCell();
    if (focusedCell) {
      setTimeout(() => {
        try {
          params.api.setFocusedCell(
            focusedCell.rowIndex,
            focusedCell.column.getColId(),
          );
        } catch (err) {
          // Ignore
        }
      }, 50);
    }
  },
  onCellFocused: (params: any) => {
    const rowIndex = params.rowIndex;
    const column = params.column;
    if (rowIndex === null || rowIndex === undefined || !column) return;
    const columnId = column.getColId();

    if (!params.context) {
      params.context = {};
    }

    if (params.context.isDragging) return;
    if (isCtrlPressed) return;

    const state = params.context.customRangeSelectionState;
    if (state?.isSelecting) return;

    // Track the active grid for global copy operations
    activeGridApi = params.api;
    activeGridContext = params.context;

    if (typeof window !== 'undefined' && !isGlobalKeyDownRegistered) {
      window.addEventListener('keydown', handleGlobalKeyDown);
      window.addEventListener('mousedown', handleGlobalMouseDown);
      isGlobalKeyDownRegistered = true;
    }

    if (isShiftPressed && state && state.ranges && state.ranges.length > 0) {
      const activeRange = state.ranges[state.activeRangeIndex];
      activeRange.endCell = { rowIndex, columnId };
      updateRangeColumnIds(activeRange, params.api);
      cleanupEnclosedRanges(state, params.api);
      params.api.refreshCells({ force: true });
      return;
    }

    // Otherwise, move/start a single-cell selection
    params.context.customRangeSelectionState = {
      isSelecting: false,
      ranges: [
        {
          startCell: { rowIndex, columnId },
          endCell: { rowIndex, columnId },
          columnIds: [columnId],
        },
      ],
      activeRangeIndex: 0,
    };
    params.api.refreshCells({ force: true });
  },
  onColumnMoved: (params: any) => {
    params.api.refreshCells({ force: true });
  },
  onColumnVisible: (params: any) => {
    params.api.refreshCells({ force: true });
  },
  onColumnPinned: (params: any) => {
    params.api.refreshCells({ force: true });
  },
  onCellMouseDown: (params: any) => {
    const event = params.event as MouseEvent;
    if (event.button !== 0) return; // Left click only

    const target = event.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.closest('.ag-cell-edit-wrapper') ||
        target.closest('.ag-popup-editor'))
    ) {
      return;
    }

    // Skip range selection when row drag is active to avoid event conflict
    if (params.context?.isDragging) return;

    if (!params.context) {
      params.context = {};
    }

    const rowIndex = params.node?.rowIndex;
    const columnId = params.column?.getColId();

    if (rowIndex === null || rowIndex === undefined || !columnId) return;

    // Deselect all rows when shift is held to prevent native row selection
    // from overlapping with our custom cell range selection.
    if (event.shiftKey) {
      params.api.deselectAll();
    }

    const allColumns = params.api.getAllDisplayedColumns();
    if (!allColumns) return;

    const currentColIdx = allColumns.findIndex(
      (c: any) => c.getColId() === columnId,
    );
    if (currentColIdx === -1) return;

    // Clear previous active grid selection if switching grids
    if (activeGridApi && activeGridApi !== params.api && activeGridContext) {
      if (activeGridContext.customRangeSelectionState?.ranges) {
        activeGridContext.customRangeSelectionState = null;
        if (
          typeof activeGridApi.isDestroyed === 'function' &&
          !activeGridApi.isDestroyed()
        ) {
          activeGridApi.refreshCells({ force: true });
        }
      }
    }

    // Clear current grid's old selection range on normal click
    if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
      if (params.context.customRangeSelectionState?.ranges) {
        params.context.customRangeSelectionState = null;
        params.api.refreshCells({ force: true });
      }
    }

    // Track the active grid for global copy operations
    activeGridApi = params.api;
    activeGridContext = params.context;

    if (typeof window !== 'undefined' && !isGlobalKeyDownRegistered) {
      window.addEventListener('keydown', handleGlobalKeyDown);
      window.addEventListener('mousedown', handleGlobalMouseDown);
      isGlobalKeyDownRegistered = true;
    }

    // Clear browser native selection highlighting during click and drag
    window.getSelection()?.removeAllRanges();
    document.body.style.userSelect = 'none';

    // Shift click range selection
    if (
      event.shiftKey &&
      params.context.customRangeSelectionState?.ranges?.length > 0
    ) {
      const state = params.context.customRangeSelectionState;
      console.log('Range selection expanded with Shift+Click to:', {
        rowIndex,
        columnId,
      });
      state.ranges[state.activeRangeIndex].endCell = { rowIndex, columnId };
      updateRangeColumnIds(state.ranges[state.activeRangeIndex], params.api);
      state.isSelecting = false;
      cleanupEnclosedRanges(state, params.api);
      document.body.style.userSelect = '';
      params.api.refreshCells({ force: true });
      return; // Skip single cell refresh
    } else if (
      (event.ctrlKey || event.metaKey) &&
      params.context.customRangeSelectionState?.ranges
    ) {
      const state = params.context.customRangeSelectionState;

      // Find if this cell is already selected in any of the ranges
      const existingRangeIndex = state.ranges.findIndex((range: any) => {
        const startRow = Math.min(
          range.startCell.rowIndex,
          range.endCell.rowIndex,
        );
        const endRow = Math.max(
          range.startCell.rowIndex,
          range.endCell.rowIndex,
        );
        if (rowIndex < startRow || rowIndex > endRow) return false;

        if (range.columnIds) {
          return range.columnIds.includes(columnId);
        }

        // Fallback
        const startCol = params.api.getColumn(range.startCell.columnId);
        const endCol = params.api.getColumn(range.endCell.columnId);
        const startColIdx = startCol ? allColumns.indexOf(startCol) : -1;
        const endColIdx = endCol ? allColumns.indexOf(endCol) : -1;
        const minColIdx = Math.min(startColIdx, endColIdx);
        const maxColIdx = Math.max(startColIdx, endColIdx);
        return currentColIdx >= minColIdx && currentColIdx <= maxColIdx;
      });

      if (existingRangeIndex !== -1) {
        console.log('Unselecting range at index:', existingRangeIndex);
        state.ranges.splice(existingRangeIndex, 1);

        if (state.ranges.length === 0) {
          params.context.customRangeSelectionState = null;
        } else {
          state.activeRangeIndex = Math.max(0, state.ranges.length - 1);
          state.isSelecting = false;
        }

        document.body.style.userSelect = '';
        params.api.refreshCells({ force: true });
        return;
      }

      console.log('New multi-range started at:', { rowIndex, columnId });

      const oldActiveRangeIndex = state.activeRangeIndex;
      const oldActive = state.ranges[oldActiveRangeIndex];

      // Push new range and update active index FIRST
      state.ranges.push({
        startCell: { rowIndex, columnId },
        endCell: { rowIndex, columnId },
        columnIds: [columnId],
      });
      state.activeRangeIndex = state.ranges.length - 1;
      state.isSelecting = true;

      // NOW refresh the old active range so it re-evaluates without being the 'active' one!
      if (oldActive) {
        const oldMinRow = Math.min(
          oldActive.startCell.rowIndex,
          oldActive.endCell.rowIndex,
        );
        const oldMaxRow = Math.max(
          oldActive.startCell.rowIndex,
          oldActive.endCell.rowIndex,
        );
        const startCol = params.api.getColumn(oldActive.startCell.columnId);
        const endCol = params.api.getColumn(oldActive.endCell.columnId);
        const oldStartColIdx = startCol ? allColumns.indexOf(startCol) : -1;
        const oldEndColIdx = endCol ? allColumns.indexOf(endCol) : -1;
        const oldMinColIdx = Math.min(oldStartColIdx, oldEndColIdx);
        const oldMaxColIdx = Math.max(oldStartColIdx, oldEndColIdx);

        const rowNodesToRefresh = [];
        for (let r = oldMinRow; r <= oldMaxRow; r++) {
          const node = params.api.getDisplayedRowAtIndex(r);
          if (node) rowNodesToRefresh.push(node);
        }
        const colsToRefresh = allColumns.slice(oldMinColIdx, oldMaxColIdx + 1);
        params.api.refreshCells({
          rowNodes: rowNodesToRefresh,
          columns: colsToRefresh,
          force: true,
        });
      }
    } else {
      // Normal click: start new range selection
      console.log('Range selection started at:', { rowIndex, columnId });
      params.context.customRangeSelectionState = {
        isSelecting: true,
        ranges: [
          {
            startCell: { rowIndex, columnId },
            endCell: { rowIndex, columnId },
            columnIds: [columnId],
          },
        ],
        activeRangeIndex: 0,
      };
    }

    // const target = event.target as HTMLElement | null;
    const gridRoot = target?.closest('.ag-root-wrapper');
    const viewport = gridRoot?.querySelector(
      '.ag-body-viewport',
    ) as HTMLElement | null;

    let autoScrollInterval: number | null = null;
    let currentScrollDeltaY = 0;
    let currentScrollDeltaX = 0;
    let lastMouseX = event.clientX;
    let lastMouseY = event.clientY;
    let lastHoveredEl: Element | null = null;

    const stopAutoScroll = () => {
      if (autoScrollInterval) {
        window.clearInterval(autoScrollInterval);
        autoScrollInterval = null;
      }
    };

    const startAutoScroll = () => {
      if (!autoScrollInterval && viewport) {
        autoScrollInterval = window.setInterval(() => {
          if (currentScrollDeltaY !== 0 || currentScrollDeltaX !== 0) {
            viewport.scrollBy({
              top: currentScrollDeltaY,
              left: currentScrollDeltaX,
            });
            const el = document.elementFromPoint(lastMouseX, lastMouseY);
            if (el && el !== lastHoveredEl) {
              el.dispatchEvent(
                new MouseEvent('mouseover', {
                  bubbles: true,
                  clientX: lastMouseX,
                  clientY: lastMouseY,
                }),
              );
              lastHoveredEl = el;
            }
          }
        }, 30);
      }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!viewport || !gridRoot) return;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;

      const rect = gridRoot.getBoundingClientRect();
      const scrollZone = 40;

      let scrollDeltaY = 0;
      let scrollDeltaX = 0;

      if (e.clientY < rect.top + scrollZone) scrollDeltaY = -20;
      else if (e.clientY > rect.bottom - scrollZone) scrollDeltaY = 20;

      if (e.clientX < rect.left + scrollZone) scrollDeltaX = -20;
      else if (e.clientX > rect.right - scrollZone) scrollDeltaX = 20;

      if (scrollDeltaY !== 0 || scrollDeltaX !== 0) {
        currentScrollDeltaY = scrollDeltaY;
        currentScrollDeltaX = scrollDeltaX;
        startAutoScroll();
      } else {
        stopAutoScroll();
      }
    };

    const handleGlobalMouseUp = () => {
      if (params.context?.customRangeSelectionState) {
        params.context.customRangeSelectionState.isSelecting = false;
        cleanupEnclosedRanges(
          params.context.customRangeSelectionState,
          params.api,
        );
      }
      document.body.style.userSelect = '';
      stopAutoScroll();
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('mousemove', handleGlobalMouseMove);

    // Refresh ONLY the single clicked start cell for instant visual response
    params.api.refreshCells({
      rowNodes: [params.node],
      columns: [params.column],
      force: true,
    });
  },

  onCellMouseOver: (params: any) => {
    // Skip range selection when row drag is active to avoid event conflict
    if (params.context?.isDragging) return;

    const state = params.context?.customRangeSelectionState;
    if (
      !state ||
      !state.isSelecting ||
      !state.ranges ||
      state.ranges.length === 0
    )
      return;

    const rowIndex = params.node?.rowIndex;
    const columnId = params.column?.getColId();

    if (rowIndex === null || rowIndex === undefined || !columnId) return;

    const activeRange = state.ranges[state.activeRangeIndex];

    // Skip if same cell (no boundary change)
    if (
      activeRange.endCell.rowIndex === rowIndex &&
      activeRange.endCell.columnId === columnId
    )
      return;

    const allColumns = params.api.getAllDisplayedColumns();
    if (!allColumns) return;

    const startColIdx = allColumns.findIndex(
      (c: any) => c.getColId() === activeRange.startCell.columnId,
    );
    const endColIdx = allColumns.findIndex(
      (c: any) => c.getColId() === columnId,
    );
    const prevEndColIdx = allColumns.findIndex(
      (c: any) => c.getColId() === activeRange.endCell.columnId,
    );

    if (startColIdx === -1 || endColIdx === -1 || prevEndColIdx === -1) return;

    // Calculate selection bounds
    const oldMinRow = Math.min(
      activeRange.startCell.rowIndex,
      activeRange.endCell.rowIndex,
    );
    const oldMaxRow = Math.max(
      activeRange.startCell.rowIndex,
      activeRange.endCell.rowIndex,
    );
    const newMinRow = Math.min(activeRange.startCell.rowIndex, rowIndex);
    const newMaxRow = Math.max(activeRange.startCell.rowIndex, rowIndex);

    const oldMinColIdx = Math.min(startColIdx, prevEndColIdx);
    const oldMaxColIdx = Math.max(startColIdx, prevEndColIdx);
    const newMinColIdx = Math.min(startColIdx, endColIdx);
    const newMaxColIdx = Math.max(startColIdx, endColIdx);

    // Update state
    activeRange.endCell = { rowIndex, columnId };
    updateRangeColumnIds(activeRange, params.api);

    // Row union to refresh
    const refreshMinRow = Math.min(oldMinRow, newMinRow);
    const refreshMaxRow = Math.max(oldMaxRow, newMaxRow);
    const rowNodesToRefresh = [];
    for (let r = refreshMinRow; r <= refreshMaxRow; r++) {
      const node = params.api.getDisplayedRowAtIndex(r);
      if (node) rowNodesToRefresh.push(node);
    }

    // Column union to refresh
    const refreshMinColIdx = Math.min(oldMinColIdx, newMinColIdx);
    const refreshMaxColIdx = Math.max(oldMaxColIdx, newMaxColIdx);
    const columnsToRefresh = allColumns.slice(
      refreshMinColIdx,
      refreshMaxColIdx + 1,
    );

    // Perform highly targeted visual update
    params.api.refreshCells({
      rowNodes: rowNodesToRefresh,
      columns: columnsToRefresh,
      force: true,
    });
  },

  onCellKeyDown: (params: any) => {
    const event = params.event as KeyboardEvent;
    const isCopy =
      (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c';

    if (isCopy) {
      const state = params.context?.customRangeSelectionState;
      if (!state || !state.ranges || state.ranges.length === 0) return;

      event.preventDefault();
      copyRangesToClipboard(state, params.api, params.context);
    }

    if (event.key === 'Escape') {
      if (params.context?.customRangeSelectionState) {
        console.log('Range selection cleared via Escape');
        params.context.customRangeSelectionState = null;
        params.api.refreshCells({ force: true });
      }
    }
  },
};

/**
 * Robust fallback text copy utility for non-secure HTTP contexts.
 */
function fallbackCopyText(text: string) {
  const textArea = document.createElement('textarea');
  textArea.value = text;

  // Prevent styling issues and scroll behavior
  textArea.style.top = '0';
  textArea.style.left = '0';
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';

  // Append inside the active modal/dialog if present to bypass MUI FocusTrap
  const dialogs = document.querySelectorAll('[role="dialog"]');
  const parent =
    dialogs.length > 0 ? dialogs[dialogs.length - 1] : document.body;
  parent.appendChild(textArea);

  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    if (successful) {
      console.log('Fallback: Custom range cell values copied successfully.');
    } else {
      console.error('Fallback: Copy command failed.');
    }
  } catch (err) {
    console.error('Fallback: Unable to copy text:', err);
  }

  parent.removeChild(textArea);
}

/**
 * Helper utility to aggregate multi-range cell selections into a TSV bounding-box format
 */
function copyRangesToClipboard(state: any, api: any, context: any) {
  if (!state || !state.ranges || state.ranges.length === 0) return;

  const allColumns = api.getAllDisplayedColumns();
  if (!allColumns) return;

  const validRanges: any[] = [];

  // Parse ranges using columnIds for exact column tracking after column moves
  state.ranges.forEach((range: any) => {
    const startRow = Math.min(range.startCell.rowIndex, range.endCell.rowIndex);
    const endRow = Math.max(range.startCell.rowIndex, range.endCell.rowIndex);

    let colIds = range.columnIds;
    if (!colIds || colIds.length === 0) {
      // Fallback: recalculate from startCell/endCell
      const startCol = api.getColumn(range.startCell.columnId);
      const endCol = api.getColumn(range.endCell.columnId);
      const startColIdx = startCol ? allColumns.indexOf(startCol) : -1;
      const endColIdx = endCol ? allColumns.indexOf(endCol) : -1;
      if (startColIdx === -1 || endColIdx === -1) return;
      const minIdx = Math.min(startColIdx, endColIdx);
      const maxIdx = Math.max(startColIdx, endColIdx);
      colIds = allColumns
        .slice(minIdx, maxIdx + 1)
        .map((c: any) => c.getColId());
    }

    // Resolve each columnId to its current display index and sort by display order
    const colIndices = colIds
      .map((id: string) =>
        allColumns.findIndex((c: any) => c.getColId() === id),
      )
      .filter((idx: number) => idx !== -1)
      .sort((a: number, b: number) => a - b);

    if (colIndices.length === 0) return;

    validRanges.push({
      startRow,
      endRow,
      colIndices,
    });
  });

  // Merge overlapping ranges in 2D to prevent duplicate data copying
  let merged = true;
  while (merged) {
    merged = false;
    for (let i = 0; i < validRanges.length; i++) {
      for (let j = i + 1; j < validRanges.length; j++) {
        const a = validRanges[i];
        const b = validRanges[j];

        const rowOverlap = !(a.endRow < b.startRow || b.endRow < a.startRow);
        const colOverlap = a.colIndices.some((idx: number) =>
          b.colIndices.includes(idx),
        );

        if (rowOverlap && colOverlap) {
          // Merge: union of rows and exact column indices
          const mergedColIndices = [
            ...new Set([...a.colIndices, ...b.colIndices]),
          ].sort((x: number, y: number) => x - y);
          validRanges[i] = {
            startRow: Math.min(a.startRow, b.startRow),
            endRow: Math.max(a.endRow, b.endRow),
            colIndices: mergedColIndices,
          };
          validRanges.splice(j, 1);
          merged = true;
          break;
        }
      }
      if (merged) break;
    }
  }

  // Group valid ranges that share the exact same row span (same startRow and endRow indices)
  const groupsMap = new Map<string, any[]>();
  validRanges.forEach((vr) => {
    const key = `${vr.startRow}_${vr.endRow}`;
    if (!groupsMap.has(key)) {
      groupsMap.set(key, []);
    }
    groupsMap.get(key)!.push(vr);
  });

  // Sort groups vertically by startRow to maintain visual top-to-bottom layout
  const sortedGroups = Array.from(groupsMap.values()).sort((a, b) => {
    return a[0].startRow - b[0].startRow;
  });

  // Sort ranges within each group horizontally from left to right (by first column index)
  sortedGroups.forEach((group) => {
    group.sort((a, b) => a.colIndices[0] - b.colIndices[0]);
  });

  // Format each group into a TSV block
  const regionTexts = sortedGroups
    .map((group) => {
      const groupStartRow = group[0].startRow;
      const groupEndRow = group[0].endRow;
      const groupRowsText: string[] = [];

      for (let r = groupStartRow; r <= groupEndRow; r++) {
        const rowNode = api.getDisplayedRowAtIndex(r);
        if (!rowNode) continue;

        // Extract cells from each range using exact selected columns (not continuous slice)
        const rowParts = group.map((vr) => {
          const rangeColumns = vr.colIndices.map(
            (idx: number) => allColumns[idx],
          );
          const cellValues = rangeColumns.map((col: any) => {
            const colDef = col.getColDef();
            let value = api.getCellValue({
              rowNode,
              colKey: col,
              useFormatter: true,
            });

            if (value === null || value === undefined || value === '') {
              const rawValue =
                api.getCellValue({
                  rowNode,
                  colKey: col,
                  useFormatter: false,
                }) ??
                api.getCellValue(rowNode, col) ??
                rowNode.data?.[colDef?.field || ''] ??
                rowNode.data?.[col.getColId() || ''];

              if (rawValue !== null && rawValue !== undefined) {
                if (typeof colDef?.valueFormatter === 'function') {
                  value = colDef.valueFormatter({
                    value: rawValue,
                    node: rowNode,
                    data: rowNode.data,
                    colDef,
                    column: col,
                    api,
                    context,
                  });
                } else {
                  value = rawValue;
                }
              }
            }

            return value != null ? String(value) : '';
          });

          return cellValues.join('\t');
        });

        groupRowsText.push(rowParts.join('\t'));
      }

      return groupRowsText.join('\n');
    })
    .filter((text: string) => text !== '');

  const clipboardText = regionTexts.join('\n');
  console.log(
    'Copying custom multi-range selected cell values globally (TSV formatted):\n',
    clipboardText,
  );

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(clipboardText).catch((err) => {
      console.error('Failed to copy cell range using Clipboard API:', err);
      fallbackCopyText(clipboardText);
    });
  } else {
    fallbackCopyText(clipboardText);
  }
}
