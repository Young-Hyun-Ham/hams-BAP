'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Modal, Typography } from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { getScenarioDeployHistory } from '../../services/backendService';
import { useBuilderStore } from '../../store';

import { AppLoadingOverlay } from '@/components/common/AppLoadingOverlay';
import SectionArea from '@/components/common/SectionArea';
import { useModal } from '@/providers/ModalProvider';
import GridPagination from './GridPagination';

type DeployHistoryListModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectDeployHistory: (router: any) => void;
};

const defaultGridOptions: any = 
{
    "context": {},
    "pagination": false,
    "paginationPageSize": 50,
    "paginationPageSizeSelector": [
        10,
        20,
        50,
        100,
        200
    ],
    "rowSelection": {
        "mode": "singleRow",
        "checkboxes": false,
        "enableClickSelection": true
    },
    "rowDragManaged": false,
    "enableRowPinning": true,
    "readOnlyEdit": false,
    "singleClickEdit": false,
    "stopEditingWhenCellsLoseFocus": false,
    "suppressClickEdit": false,
    "suppressStartEditOnTab": false,
    "invalidEditValueMode": "revert",
    "suppressCellFocus": false,
    "animateRows": true,
    "defaultColDef": {
        "resizable": true,
        "sortable": true,
        "filter": false,
        "editable": false,
        "floatingFilter": false,
        "minWidth": 100,
        "autoHeaderHeight": true,
        "wrapHeaderText": false,
        "cellClassRules": {}
    },
    "suppressMovableColumns": false,
    "suppressColumnMoveAnimation": false,
    "suppressDragLeaveHidesColumns": true,
    "hidePaddedHeaderRows": true,
    "defaultExcelExportParams": {
        "fileName": "export.xlsx",
        "sheetName": "Sheet1"
    },
    "cellSelection": false,
    "enableCellTextSelection": false,
    "ensureDomOrder": true,
    "suppressMenuHide": true,
    "rowHeight": 30,
    "headerHeight": 32,
    "undoRedoCellEditing": true,
    "undoRedoCellEditingLimit": 10,
    "cacheQuickFilter": false,
    "includeHiddenColumnsInQuickFilter": false,
    "columnTypes": {
        "dateColumn": {
            "filter": "agDateColumnFilter",
            "cellDataType": "dateString",
            "filterParams": {}
        },
        "dateTimeColumn": {
            "filter": "agDateColumnFilter",
            "cellDataType": "dateString",
            "filterParams": {}
        },
        "numberColumn": {
            "filter": "agNumberColumnFilter",
            "cellStyle": {
                "textAlign": "right"
            }
        },
        "currencyColumn": {
            "filter": "agNumberColumnFilter",
            "cellStyle": {
                "textAlign": "right"
            }
        },
        "checkboxColumn": {
            "cellRenderer": "agCheckboxCellRenderer",
            "cellEditor": "agCheckboxCellEditor",
            "filterParams": {}
        },
        "selectColumn": {
            "cellEditor": {},
            "cellEditorPopup": true,
            "cellStyle": {
                "padding": 0
            }
        },
        "radioColumn": {
            "width": 220,
            "sortable": false,
            "suppressHeaderMenuButton": true,
            "cellStyle": {
                "display": "flex",
                "alignItems": "center"
            }
        },
        "singleRadioColumn": {
            "field": "row_selected",
            "width": 50,
            "minWidth": 50,
            "maxWidth": 50,
            "sortable": false,
            "filter": false,
            "resizable": false,
            "headerName": "",
            "pinned": "left",
            "cellStyle": {
                "padding": 0
            },
            "editable": false,
            "suppressHeaderMenuButton": true
        },
        "multiSelectColumn": {
            "width": 250,
            "sortable": false,
            "filter": false,
            "editable": true,
            "cellEditor": {
                "compare": null
            },
            "cellEditorPopup": true,
            "cellEditorPopupPosition": "under",
            "singleClickEdit": true
        },
        "deleteIcon": {
            "width": 30,
            "sortable": false,
            "filter": false,
            "resizable": false,
            "headerClass": "ag-center-header"
        },
        "actionStatus": {
            "width": 130,
            "editable": true,
            "cellEditor": {},
            "cellEditorPopup": true,
            "sortable": false,
            "cellStyle": {
                "padding": 0
            }
        },
        "range": {
            "cellEditor": {},
            "editable": true,
            "cellStyle": {
                "padding": 0
            }
        },
        "chipCell": {
            "width": 150,
            "editable": false
        },
        "switchCell": {
            "width": 110,
            "editable": false,
            "sortable": false
        },
        "selectAndTextCell": {
            "minWidth": 350,
            "autoHeight": true,
            "editable": false,
            "sortable": false
        }
    },
    "theme": {
        "themeLogger": {},
        "parts": [
            {
                "modeParams": {
                    "$default": {
                        "wrapperBorder": true,
                        "rowBorder": true,
                        "headerRowBorder": true,
                        "footerRowBorder": {
                            "ref": "rowBorder"
                        },
                        "columnBorder": {
                            "style": "solid",
                            "width": 1,
                            "color": "transparent"
                        },
                        "headerColumnBorder": false,
                        "headerColumnBorderHeight": "100%",
                        "pinnedColumnBorder": true,
                        "pinnedRowBorder": true,
                        "sidePanelBorder": true,
                        "sideBarPanelWidth": 250,
                        "sideBarBackgroundColor": {
                            "ref": "chromeBackgroundColor"
                        },
                        "sideButtonBarBackgroundColor": {
                            "ref": "sideBarBackgroundColor"
                        },
                        "sideButtonBarTopPadding": 0,
                        "sideButtonSelectedUnderlineWidth": 2,
                        "sideButtonSelectedUnderlineColor": "transparent",
                        "sideButtonSelectedUnderlineTransitionDuration": 0,
                        "sideButtonBackgroundColor": "transparent",
                        "sideButtonTextColor": {
                            "ref": "textColor"
                        },
                        "sideButtonHoverBackgroundColor": {
                            "ref": "sideButtonBackgroundColor"
                        },
                        "sideButtonHoverTextColor": {
                            "ref": "sideButtonTextColor"
                        },
                        "sideButtonSelectedBackgroundColor": {
                            "ref": "backgroundColor"
                        },
                        "sideButtonSelectedTextColor": {
                            "ref": "sideButtonTextColor"
                        },
                        "sideButtonBorder": "solid 1px transparent",
                        "sideButtonSelectedBorder": true,
                        "sideButtonLeftPadding": {
                            "ref": "spacing"
                        },
                        "sideButtonRightPadding": {
                            "ref": "spacing"
                        },
                        "sideButtonVerticalPadding": {
                            "calc": "spacing * 3"
                        },
                        "headerBackgroundColor": {
                            "ref": "chromeBackgroundColor"
                        },
                        "headerFontFamily": {
                            "ref": "fontFamily"
                        },
                        "cellFontFamily": {
                            "ref": "fontFamily"
                        },
                        "headerFontWeight": 500,
                        "headerFontSize": {
                            "ref": "fontSize"
                        },
                        "dataFontSize": {
                            "ref": "fontSize"
                        },
                        "headerTextColor": {
                            "ref": "textColor"
                        },
                        "headerCellHoverBackgroundColor": "transparent",
                        "headerCellMovingBackgroundColor": {
                            "ref": "headerCellHoverBackgroundColor"
                        },
                        "headerCellBackgroundTransitionDuration": "0.2s",
                        "cellTextColor": {
                            "ref": "textColor"
                        },
                        "rangeSelectionBorderStyle": "solid",
                        "rangeSelectionBorderColor": {
                            "ref": "accentColor"
                        },
                        "rangeSelectionBackgroundColor": {
                            "ref": "accentColor",
                            "mix": 0.2
                        },
                        "rangeSelectionChartBackgroundColor": "#0058FF1A",
                        "rangeSelectionChartCategoryBackgroundColor": "#00FF841A",
                        "rangeSelectionHighlightColor": {
                            "ref": "accentColor",
                            "mix": 0.5
                        },
                        "rangeHeaderHighlightColor": {
                            "ref": "foregroundColor",
                            "mix": 0.08,
                            "onto": "headerBackgroundColor"
                        },
                        "rowNumbersSelectedColor": {
                            "ref": "accentColor",
                            "mix": 0.5
                        },
                        "rowHoverColor": {
                            "ref": "accentColor",
                            "mix": 0.08
                        },
                        "columnHoverColor": {
                            "ref": "accentColor",
                            "mix": 0.05
                        },
                        "selectedRowBackgroundColor": {
                            "ref": "accentColor",
                            "mix": 0.12
                        },
                        "modalOverlayBackgroundColor": {
                            "ref": "backgroundColor",
                            "mix": 0.66
                        },
                        "dataBackgroundColor": {
                            "ref": "backgroundColor"
                        },
                        "oddRowBackgroundColor": {
                            "ref": "dataBackgroundColor"
                        },
                        "wrapperBorderRadius": 8,
                        "cellHorizontalPadding": {
                            "calc": "spacing * 2 * cellHorizontalPaddingScale"
                        },
                        "cellWidgetSpacing": {
                            "calc": "spacing * 1.5"
                        },
                        "cellHorizontalPaddingScale": 1,
                        "rowGroupIndentSize": {
                            "calc": "cellWidgetSpacing + iconSize"
                        },
                        "valueChangeDeltaUpColor": "#43a047",
                        "valueChangeDeltaDownColor": "#e53935",
                        "valueChangeValueHighlightBackgroundColor": "#16a08580",
                        "rowHeight": {
                            "calc": "max(iconSize, dataFontSize) + spacing * 3.25 * rowVerticalPaddingScale"
                        },
                        "rowVerticalPaddingScale": 1,
                        "headerHeight": {
                            "calc": "max(iconSize, dataFontSize) + spacing * 4 * headerVerticalPaddingScale"
                        },
                        "headerVerticalPaddingScale": 1,
                        "paginationPanelHeight": {
                            "ref": "rowHeight",
                            "calc": "max(rowHeight, 22px)"
                        },
                        "dragHandleColor": {
                            "ref": "foregroundColor",
                            "mix": 0.7
                        },
                        "headerColumnResizeHandleHeight": "30%",
                        "headerColumnResizeHandleWidth": 2,
                        "headerColumnResizeHandleColor": {
                            "ref": "borderColor"
                        },
                        "widgetContainerHorizontalPadding": {
                            "calc": "spacing * 1.5"
                        },
                        "widgetContainerVerticalPadding": {
                            "calc": "spacing * 1.5"
                        },
                        "widgetHorizontalSpacing": {
                            "calc": "spacing * 1.5"
                        },
                        "widgetVerticalSpacing": {
                            "ref": "spacing"
                        },
                        "iconButtonColor": {
                            "ref": "iconColor"
                        },
                        "iconButtonBackgroundColor": "transparent",
                        "iconButtonBackgroundSpread": 4,
                        "iconButtonBorderRadius": 1,
                        "iconButtonHoverColor": {
                            "ref": "iconButtonColor"
                        },
                        "iconButtonHoverBackgroundColor": {
                            "ref": "foregroundColor",
                            "mix": 0.1
                        },
                        "iconButtonActiveColor": {
                            "ref": "accentColor"
                        },
                        "iconButtonActiveBackgroundColor": {
                            "ref": "accentColor",
                            "mix": 0.28
                        },
                        "iconButtonActiveIndicatorColor": {
                            "ref": "accentColor"
                        },
                        "menuBorder": {
                            "color": {
                                "ref": "foregroundColor",
                                "mix": 0.2
                            }
                        },
                        "menuBackgroundColor": {
                            "ref": "foregroundColor",
                            "mix": 0.03,
                            "onto": "backgroundColor"
                        },
                        "menuTextColor": {
                            "ref": "foregroundColor",
                            "mix": 0.95,
                            "onto": "backgroundColor"
                        },
                        "menuShadow": {
                            "ref": "popupShadow"
                        },
                        "menuSeparatorColor": {
                            "ref": "borderColor"
                        },
                        "setFilterIndentSize": {
                            "ref": "iconSize"
                        },
                        "chartMenuPanelWidth": 260,
                        "chartMenuLabelColor": {
                            "ref": "foregroundColor",
                            "mix": 0.8
                        },
                        "dialogShadow": {
                            "ref": "popupShadow"
                        },
                        "cellEditingBorder": {
                            "color": {
                                "ref": "accentColor"
                            }
                        },
                        "cellEditingShadow": {
                            "ref": "cardShadow"
                        },
                        "fullRowEditInvalidBackgroundColor": {
                            "ref": "invalidColor",
                            "onto": "backgroundColor",
                            "mix": 0.25
                        },
                        "dialogBorder": {
                            "color": {
                                "ref": "foregroundColor",
                                "mix": 0.2
                            }
                        },
                        "panelBackgroundColor": {
                            "ref": "backgroundColor"
                        },
                        "panelTitleBarHeight": {
                            "ref": "headerHeight"
                        },
                        "panelTitleBarBackgroundColor": {
                            "ref": "headerBackgroundColor"
                        },
                        "panelTitleBarIconColor": {
                            "ref": "headerTextColor"
                        },
                        "panelTitleBarTextColor": {
                            "ref": "headerTextColor"
                        },
                        "panelTitleBarFontWeight": {
                            "ref": "headerFontWeight"
                        },
                        "panelTitleBarBorder": true,
                        "columnSelectIndentSize": {
                            "ref": "iconSize"
                        },
                        "toolPanelSeparatorBorder": true,
                        "columnDropCellBackgroundColor": {
                            "ref": "foregroundColor",
                            "mix": 0.07
                        },
                        "columnDropCellTextColor": {
                            "ref": "textColor"
                        },
                        "columnDropCellDragHandleColor": {
                            "ref": "textColor"
                        },
                        "columnDropCellBorder": {
                            "color": {
                                "ref": "foregroundColor",
                                "mix": 0.13
                            }
                        },
                        "selectCellBackgroundColor": {
                            "ref": "foregroundColor",
                            "mix": 0.07
                        },
                        "selectCellBorder": {
                            "color": {
                                "ref": "foregroundColor",
                                "mix": 0.13
                            }
                        },
                        "advancedFilterBuilderButtonBarBorder": true,
                        "advancedFilterBuilderIndentSize": {
                            "calc": "spacing * 2 + iconSize"
                        },
                        "advancedFilterBuilderJoinPillColor": "#f08e8d",
                        "advancedFilterBuilderColumnPillColor": "#a6e194",
                        "advancedFilterBuilderOptionPillColor": "#f3c08b",
                        "advancedFilterBuilderValuePillColor": "#85c0e4",
                        "filterPanelApplyButtonColor": {
                            "ref": "backgroundColor"
                        },
                        "filterPanelApplyButtonBackgroundColor": {
                            "ref": "accentColor"
                        },
                        "filterPanelCardSubtleColor": {
                            "ref": "textColor",
                            "mix": 0.7
                        },
                        "filterPanelCardSubtleHoverColor": {
                            "ref": "textColor"
                        },
                        "findMatchColor": {
                            "ref": "foregroundColor"
                        },
                        "findMatchBackgroundColor": "#ffff00",
                        "findActiveMatchColor": {
                            "ref": "foregroundColor"
                        },
                        "findActiveMatchBackgroundColor": "#ffa500",
                        "filterToolPanelGroupIndent": {
                            "ref": "spacing"
                        },
                        "rowLoadingSkeletonEffectColor": {
                            "ref": "foregroundColor",
                            "mix": 0.15
                        },
                        "statusBarLabelColor": {
                            "ref": "foregroundColor"
                        },
                        "statusBarLabelFontWeight": 500,
                        "statusBarValueColor": {
                            "ref": "foregroundColor"
                        },
                        "statusBarValueFontWeight": 500,
                        "pinnedSourceRowTextColor": {
                            "ref": "textColor"
                        },
                        "pinnedSourceRowBackgroundColor": {
                            "ref": "dataBackgroundColor"
                        },
                        "pinnedSourceRowFontWeight": 600,
                        "pinnedRowFontWeight": 600,
                        "pinnedRowBackgroundColor": {
                            "ref": "dataBackgroundColor"
                        },
                        "pinnedRowTextColor": {
                            "ref": "textColor"
                        }
                    }
                }
            },
            {
                "feature": "buttonStyle",
                "css": ":where(.ag-button){background:none;border:none;color:inherit;cursor:pointer;font-family:inherit;font-size:inherit;font-weight:inherit;letter-spacing:inherit;line-height:inherit;margin:0;padding:0;text-indent:inherit;text-shadow:inherit;text-transform:inherit;word-spacing:inherit;&:disabled{cursor:default}&:focus-visible{box-shadow:var(--ag-focus-shadow);outline:none}}.ag-standard-button{-webkit-appearance:none;-moz-appearance:none;appearance:none;background-color:var(--ag-button-background-color);border:var(--ag-button-border);border-radius:var(--ag-button-border-radius);color:var(--ag-button-text-color);cursor:pointer;font-weight:var(--ag-button-font-weight);padding:var(--ag-button-vertical-padding) var(--ag-button-horizontal-padding);&:hover{background-color:var(--ag-button-hover-background-color);border:var(--ag-button-hover-border);color:var(--ag-button-hover-text-color)}&:active{background-color:var(--ag-button-active-background-color);border:var(--ag-button-active-border);color:var(--ag-button-active-text-color)}&:disabled{background-color:var(--ag-button-disabled-background-color);border:var(--ag-button-disabled-border);color:var(--ag-button-disabled-text-color)}}",
                "modeParams": {
                    "$default": {
                        "buttonTextColor": "inherit",
                        "buttonFontWeight": "normal",
                        "buttonBackgroundColor": {
                            "ref": "backgroundColor"
                        },
                        "buttonBorder": true,
                        "buttonBorderRadius": {
                            "ref": "borderRadius"
                        },
                        "buttonHorizontalPadding": {
                            "calc": "spacing * 2"
                        },
                        "buttonVerticalPadding": {
                            "ref": "spacing"
                        },
                        "buttonHoverTextColor": {
                            "ref": "buttonTextColor"
                        },
                        "buttonHoverBackgroundColor": {
                            "ref": "rowHoverColor"
                        },
                        "buttonHoverBorder": {
                            "ref": "buttonBorder"
                        },
                        "buttonActiveTextColor": {
                            "ref": "buttonHoverTextColor"
                        },
                        "buttonActiveBackgroundColor": {
                            "ref": "buttonHoverBackgroundColor"
                        },
                        "buttonActiveBorder": {
                            "color": {
                                "ref": "accentColor"
                            }
                        },
                        "buttonDisabledTextColor": {
                            "ref": "inputDisabledTextColor"
                        },
                        "buttonDisabledBackgroundColor": {
                            "ref": "inputDisabledBackgroundColor"
                        },
                        "buttonDisabledBorder": {
                            "ref": "inputDisabledBorder"
                        }
                    }
                }
            },
            {
                "feature": "columnDropStyle",
                "css": ".ag-column-drop-vertical-empty-message{align-items:center;border:dashed var(--ag-border-width);border-color:var(--ag-border-color);display:flex;inset:0;justify-content:center;margin:calc(var(--ag-spacing)*1.5) calc(var(--ag-spacing)*2);overflow:hidden;padding:calc(var(--ag-spacing)*2);position:absolute}",
                "modeParams": {
                    "$default": {}
                }
            },
            {
                "feature": "batchEditStyle",
                "css": ".ag-cell-batch-edit{background-color:var(--ag-cell-batch-edit-background-color);color:var(--ag-cell-batch-edit-text-color);display:inherit}.ag-row-batch-edit{background-color:var(--ag-row-batch-edit-background-color);color:var(--ag-row-batch-edit-text-color)}",
                "modeParams": {
                    "$default": {
                        "cellBatchEditBackgroundColor": "rgba(220 181 139 / 16%)",
                        "cellBatchEditTextColor": "#422f00",
                        "rowBatchEditBackgroundColor": {
                            "ref": "cellBatchEditBackgroundColor"
                        },
                        "rowBatchEditTextColor": {
                            "ref": "cellBatchEditTextColor"
                        }
                    }
                }
            },
            {
                "feature": "checkboxStyle",
                "css": ".ag-checkbox-input-wrapper,.ag-radio-button-input-wrapper{background-color:var(--ag-checkbox-unchecked-background-color);border:solid var(--ag-checkbox-border-width) var(--ag-checkbox-unchecked-border-color);flex:none;height:var(--ag-icon-size);position:relative;width:var(--ag-icon-size);:where(input){-webkit-appearance:none;-moz-appearance:none;appearance:none;cursor:pointer;display:block;height:var(--ag-icon-size);margin:0;opacity:0;width:var(--ag-icon-size)}&:after{content:\"\";display:block;inset:0;-webkit-mask-position:center;mask-position:center;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;pointer-events:none;position:absolute}&:where(.ag-checked){background-color:var(--ag-checkbox-checked-background-color);border-color:var(--ag-checkbox-checked-border-color);&:after{background-color:var(--ag-checkbox-checked-shape-color)}}&:where(:focus-within,:active){box-shadow:var(--ag-focus-shadow)}&:where(.ag-disabled){filter:grayscale();opacity:.5}}.ag-checkbox-input-wrapper{border-radius:var(--ag-checkbox-border-radius);&:where(.ag-checked):after{-webkit-mask-image:var(--ag-checkbox-checked-shape-image);mask-image:var(--ag-checkbox-checked-shape-image)}&:where(.ag-indeterminate){background-color:var(--ag-checkbox-indeterminate-background-color);border-color:var(--ag-checkbox-indeterminate-border-color);&:after{background-color:var(--ag-checkbox-indeterminate-shape-color);-webkit-mask-image:var(--ag-checkbox-indeterminate-shape-image);mask-image:var(--ag-checkbox-indeterminate-shape-image)}}}.ag-cell-editing-error .ag-checkbox-input-wrapper:focus-within{box-shadow:var(--ag-focus-error-shadow)}.ag-radio-button-input-wrapper{border-radius:100%;&:where(.ag-checked):after{-webkit-mask-image:var(--ag-radio-checked-shape-image);mask-image:var(--ag-radio-checked-shape-image)}}",
                "modeParams": {
                    "$default": {
                        "checkboxBorderWidth": 1,
                        "checkboxBorderRadius": {
                            "ref": "borderRadius"
                        },
                        "checkboxUncheckedBackgroundColor": {
                            "ref": "backgroundColor"
                        },
                        "checkboxUncheckedBorderColor": {
                            "ref": "foregroundColor",
                            "mix": 0.3,
                            "onto": "backgroundColor"
                        },
                        "checkboxCheckedBackgroundColor": {
                            "ref": "accentColor"
                        },
                        "checkboxCheckedBorderColor": {
                            "ref": "checkboxCheckedBackgroundColor"
                        },
                        "checkboxCheckedShapeImage": {
                            "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"10\" height=\"7\" fill=\"none\"><path stroke=\"#000\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"1.75\" d=\"M1 3.5 3.5 6l5-5\"/></svg>"
                        },
                        "checkboxCheckedShapeColor": {
                            "ref": "backgroundColor"
                        },
                        "checkboxIndeterminateBackgroundColor": {
                            "ref": "foregroundColor",
                            "mix": 0.3,
                            "onto": "backgroundColor"
                        },
                        "checkboxIndeterminateBorderColor": {
                            "ref": "checkboxIndeterminateBackgroundColor"
                        },
                        "checkboxIndeterminateShapeImage": {
                            "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"10\" height=\"2\" fill=\"none\"><rect width=\"10\" height=\"2\" fill=\"#000\" rx=\"1\"/></svg>"
                        },
                        "checkboxIndeterminateShapeColor": {
                            "ref": "backgroundColor"
                        },
                        "radioCheckedShapeImage": {
                            "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"6\" height=\"6\" fill=\"none\"><circle cx=\"3\" cy=\"3\" r=\"3\" fill=\"#000\"/></svg>"
                        }
                    }
                }
            },
            {
                "feature": "colorScheme",
                "modeParams": {
                    "$default": {
                        "backgroundColor": "#fff",
                        "foregroundColor": "#181d1f",
                        "borderColor": {
                            "ref": "foregroundColor",
                            "mix": 0.15
                        },
                        "chromeBackgroundColor": {
                            "ref": "foregroundColor",
                            "mix": 0.02,
                            "onto": "backgroundColor"
                        },
                        "browserColorScheme": "light"
                    },
                    "light": {
                        "backgroundColor": "#fff",
                        "foregroundColor": "#181d1f",
                        "borderColor": {
                            "ref": "foregroundColor",
                            "mix": 0.15
                        },
                        "chromeBackgroundColor": {
                            "ref": "foregroundColor",
                            "mix": 0.02,
                            "onto": "backgroundColor"
                        },
                        "browserColorScheme": "light"
                    },
                    "dark": {
                        "backgroundColor": "hsl(217, 0%, 17%)",
                        "foregroundColor": "#FFF",
                        "borderColor": {
                            "ref": "foregroundColor",
                            "mix": 0.15
                        },
                        "chromeBackgroundColor": {
                            "ref": "foregroundColor",
                            "mix": 0.05,
                            "onto": "backgroundColor"
                        },
                        "browserColorScheme": "dark",
                        "cellBatchEditBackgroundColor": "rgba(220 181 139 / 16%)",
                        "cellBatchEditTextColor": "#f3d0b3",
                        "rowBatchEditBackgroundColor": {
                            "ref": "foregroundColor",
                            "mix": 0.1,
                            "onto": "backgroundColor"
                        },
                        "rowBatchEditTextColor": {
                            "ref": "cellBatchEditTextColor"
                        },
                        "rowHoverColor": {
                            "ref": "accentColor",
                            "mix": 0.15
                        },
                        "selectedRowBackgroundColor": {
                            "ref": "accentColor",
                            "mix": 0.2
                        },
                        "menuBackgroundColor": {
                            "ref": "foregroundColor",
                            "mix": 0.1,
                            "onto": "backgroundColor"
                        },
                        "popupShadow": "0 0px 20px #000A",
                        "cardShadow": "0 1px 4px 1px #000A",
                        "advancedFilterBuilderJoinPillColor": "#7a3a37",
                        "advancedFilterBuilderColumnPillColor": "#355f2d",
                        "advancedFilterBuilderOptionPillColor": "#5a3168",
                        "advancedFilterBuilderValuePillColor": "#374c86",
                        "filterPanelApplyButtonColor": {
                            "ref": "foregroundColor"
                        },
                        "findMatchColor": {
                            "ref": "backgroundColor"
                        },
                        "findActiveMatchColor": {
                            "ref": "backgroundColor"
                        },
                        "checkboxUncheckedBorderColor": {
                            "ref": "foregroundColor",
                            "mix": 0.4,
                            "onto": "backgroundColor"
                        },
                        "toggleButtonOffBackgroundColor": {
                            "ref": "foregroundColor",
                            "mix": 0.4,
                            "onto": "backgroundColor"
                        }
                    },
                    "dark-blue": {
                        "backgroundColor": "#1f2836",
                        "foregroundColor": "#FFF",
                        "borderColor": {
                            "ref": "foregroundColor",
                            "mix": 0.15
                        },
                        "chromeBackgroundColor": {
                            "ref": "foregroundColor",
                            "mix": 0.05,
                            "onto": "backgroundColor"
                        },
                        "browserColorScheme": "dark",
                        "cellBatchEditBackgroundColor": "rgba(220 181 139 / 16%)",
                        "cellBatchEditTextColor": "#f3d0b3",
                        "rowBatchEditBackgroundColor": {
                            "ref": "foregroundColor",
                            "mix": 0.1,
                            "onto": "backgroundColor"
                        },
                        "rowBatchEditTextColor": {
                            "ref": "cellBatchEditTextColor"
                        },
                        "rowHoverColor": {
                            "ref": "accentColor",
                            "mix": 0.15
                        },
                        "selectedRowBackgroundColor": {
                            "ref": "accentColor",
                            "mix": 0.2
                        },
                        "menuBackgroundColor": {
                            "ref": "foregroundColor",
                            "mix": 0.1,
                            "onto": "backgroundColor"
                        },
                        "popupShadow": "0 0px 20px #000A",
                        "cardShadow": "0 1px 4px 1px #000A",
                        "advancedFilterBuilderJoinPillColor": "#7a3a37",
                        "advancedFilterBuilderColumnPillColor": "#355f2d",
                        "advancedFilterBuilderOptionPillColor": "#5a3168",
                        "advancedFilterBuilderValuePillColor": "#374c86",
                        "filterPanelApplyButtonColor": {
                            "ref": "foregroundColor"
                        },
                        "findMatchColor": {
                            "ref": "backgroundColor"
                        },
                        "findActiveMatchColor": {
                            "ref": "backgroundColor"
                        },
                        "checkboxUncheckedBorderColor": {
                            "ref": "foregroundColor",
                            "mix": 0.4,
                            "onto": "backgroundColor"
                        },
                        "toggleButtonOffBackgroundColor": {
                            "ref": "foregroundColor",
                            "mix": 0.4,
                            "onto": "backgroundColor"
                        }
                    }
                }
            },
            {
                "feature": "iconSet",
                "modeParams": {
                    "$default": {}
                }
            },
            {
                "feature": "tabStyle",
                "css": ".ag-tabs-header{background-color:var(--ag-tab-bar-background-color);border-bottom:var(--ag-tab-bar-border);display:flex;flex:1;gap:var(--ag-tab-spacing);padding:var(--ag-tab-bar-top-padding) var(--ag-tab-bar-horizontal-padding) 0}.ag-tabs-header-wrapper{display:flex}.ag-tabs-close-button-wrapper{align-items:center;border:0;display:flex;padding:var(--ag-spacing)}:where(.ag-ltr) .ag-tabs-close-button-wrapper{border-right:solid var(--ag-border-width) var(--ag-border-color)}:where(.ag-rtl) .ag-tabs-close-button-wrapper{border-left:solid var(--ag-border-width) var(--ag-border-color)}.ag-tabs-close-button{background-color:unset;border:0;cursor:pointer;padding:0}.ag-tab{align-items:center;background-color:var(--ag-tab-background-color);border-left:var(--ag-tab-selected-border-width) solid transparent;border-right:var(--ag-tab-selected-border-width) solid transparent;color:var(--ag-tab-text-color);cursor:pointer;display:flex;flex:1;justify-content:center;padding:var(--ag-tab-top-padding) var(--ag-tab-horizontal-padding) var(--ag-tab-bottom-padding);position:relative;&:hover{background-color:var(--ag-tab-hover-background-color);color:var(--ag-tab-hover-text-color)}&.ag-tab-selected{background-color:var(--ag-tab-selected-background-color);color:var(--ag-tab-selected-text-color)}&:after{background-color:var(--ag-tab-selected-underline-color);bottom:0;content:\"\";display:block;height:var(--ag-tab-selected-underline-width);left:0;opacity:0;position:absolute;right:0;transition:opacity var(--ag-tab-selected-underline-transition-duration)}&.ag-tab-selected:after{opacity:1}}:where(.ag-ltr) .ag-tab{&.ag-tab-selected{&:where(:not(:first-of-type)){border-left-color:var(--ag-tab-selected-border-color)}&:where(:not(:last-of-type)){border-right-color:var(--ag-tab-selected-border-color)}}}:where(.ag-rtl) .ag-tab{&.ag-tab-selected{&:where(:not(:first-of-type)){border-right-color:var(--ag-tab-selected-border-color)}&:where(:not(:last-of-type)){border-left-color:var(--ag-tab-selected-border-color)}}}",
                "modeParams": {
                    "$default": {
                        "tabBarBackgroundColor": {
                            "ref": "foregroundColor",
                            "mix": 0.05
                        },
                        "tabBarHorizontalPadding": 0,
                        "tabBarTopPadding": 0,
                        "tabBackgroundColor": "transparent",
                        "tabTextColor": {
                            "ref": "textColor",
                            "mix": 0.7
                        },
                        "tabHorizontalPadding": {
                            "ref": "spacing"
                        },
                        "tabTopPadding": {
                            "ref": "spacing"
                        },
                        "tabBottomPadding": {
                            "ref": "spacing"
                        },
                        "tabSpacing": "0",
                        "tabHoverBackgroundColor": {
                            "ref": "tabBackgroundColor"
                        },
                        "tabHoverTextColor": {
                            "ref": "textColor"
                        },
                        "tabSelectedBackgroundColor": {
                            "ref": "backgroundColor"
                        },
                        "tabSelectedTextColor": {
                            "ref": "textColor"
                        },
                        "tabSelectedBorderWidth": {
                            "ref": "borderWidth"
                        },
                        "tabSelectedBorderColor": {
                            "ref": "borderColor"
                        },
                        "tabSelectedUnderlineColor": "transparent",
                        "tabSelectedUnderlineWidth": 0,
                        "tabSelectedUnderlineTransitionDuration": 0,
                        "tabBarBorder": true
                    }
                }
            },
            {
                "feature": "inputStyle",
                "modeParams": {
                    "$default": {
                        "inputBackgroundColor": {
                            "ref": "backgroundColor"
                        },
                        "inputBorder": true,
                        "inputBorderRadius": {
                            "ref": "borderRadius"
                        },
                        "inputTextColor": {
                            "ref": "textColor"
                        },
                        "inputPlaceholderTextColor": {
                            "ref": "inputTextColor",
                            "mix": 0.5
                        },
                        "inputPaddingStart": {
                            "ref": "spacing"
                        },
                        "inputHeight": {
                            "calc": "max(iconSize, fontSize) + spacing * 2"
                        },
                        "inputFocusBackgroundColor": {
                            "ref": "inputBackgroundColor"
                        },
                        "inputFocusBorder": {
                            "color": {
                                "ref": "accentColor"
                            }
                        },
                        "inputFocusShadow": {
                            "ref": "focusShadow"
                        },
                        "inputFocusTextColor": {
                            "ref": "inputTextColor"
                        },
                        "inputDisabledBackgroundColor": {
                            "ref": "foregroundColor",
                            "mix": 0.06,
                            "onto": "backgroundColor"
                        },
                        "inputDisabledBorder": {
                            "ref": "inputBorder"
                        },
                        "inputDisabledTextColor": {
                            "ref": "textColor",
                            "mix": 0.5
                        },
                        "inputInvalidBackgroundColor": {
                            "ref": "inputBackgroundColor"
                        },
                        "inputInvalidBorder": {
                            "color": {
                                "ref": "invalidColor"
                            }
                        },
                        "inputInvalidTextColor": {
                            "ref": "inputTextColor"
                        },
                        "inputIconColor": {
                            "ref": "inputTextColor"
                        },
                        "pickerButtonBorder": true,
                        "pickerButtonFocusBorder": {
                            "ref": "inputFocusBorder"
                        },
                        "pickerButtonBackgroundColor": {
                            "ref": "backgroundColor"
                        },
                        "pickerButtonFocusBackgroundColor": {
                            "ref": "backgroundColor"
                        },
                        "pickerListBorder": true,
                        "pickerListBackgroundColor": {
                            "ref": "backgroundColor"
                        },
                        "colorPickerThumbSize": 18,
                        "colorPickerTrackSize": 12,
                        "colorPickerThumbBorderWidth": 3,
                        "colorPickerTrackBorderRadius": 12,
                        "colorPickerColorBorderRadius": 4
                    }
                }
            },
            {
                "feature": "columnDropStyle",
                "css": ".ag-column-drop-vertical-empty-message{align-items:center;border:dashed var(--ag-border-width);border-color:var(--ag-border-color);display:flex;inset:0;justify-content:center;margin:calc(var(--ag-spacing)*1.5) calc(var(--ag-spacing)*2);overflow:hidden;padding:calc(var(--ag-spacing)*2);position:absolute}",
                "modeParams": {
                    "$default": {}
                }
            },
            {
                "modeParams": {
                    "$default": {
                        "fontFamily": [
                            {
                                "googleFont": "IBM Plex Sans"
                            },
                            "-apple-system",
                            "BlinkMacSystemFont",
                            "Segoe UI",
                            "Roboto",
                            "Oxygen-Sans",
                            "Ubuntu"
                        ]
                    }
                }
            },
            {
                "modeParams": {
                    "$default": {
                        "columnBorder": false,
                        "wrapperBorder": false
                    }
                }
            }
        ]
    }
};

const DeployHistoryListModal = ({
  isOpen,
  onClose,
  onSelectDeployHistory,
}: DeployHistoryListModalProps) => {
  const [rowData, setRowData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const { showAlert} = useModal();
  const { backend, scenario } = useBuilderStore() as any;
  const [paginationModel, setPaginationModel] = useState({
    page: 1,
    pageSize: 50,
  });
  const prevPaginationRef = useRef(paginationModel);

  const currentValues: any = {};

  const fetchDeployHistory = async (searchParams: any) => {
    setLoading(true);
    try {
      const payload = {
        ...searchParams,
        scenario_id: scenario?.id || '',
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
      };
      const res: any = await getScenarioDeployHistory(backend, payload);
      const items = Array.isArray(res) ? res : (res?.items ?? []);
      setRowData(items);
      setTotalCount(
        Array.isArray(res) ? res.length : (res?.totalCount ?? items.length),
      );
    } catch (error) {
      showAlert(t('Failed to load Deploy History list.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !scenario?.id) return;
    void Promise.resolve().then(() => fetchDeployHistory(currentValues));
  }, [isOpen, scenario?.id]);

  useEffect(() => {
    if (!isOpen || !scenario?.id) return;
    if (prevPaginationRef.current === paginationModel) {
      return;
    }
    prevPaginationRef.current = paginationModel;
    fetchDeployHistory(currentValues);
  }, [paginationModel]);

  const handleSelectDeployHistory = (event: { data: any }) => {
    onSelectDeployHistory(event.data);
    onClose();
  };

  const onPaginationChange = (page: number, pageSize: number) => {
    setPaginationModel((prev) => {
      const adjustedPage = page < 1 ? 1 : page;
      if (prev.page === adjustedPage && prev.pageSize === pageSize) {
        return prev;
      }
      return {
        page: prev.pageSize !== pageSize ? 1 : adjustedPage,
        pageSize: pageSize,
      };
    });
  };

  const columnDefs: ColDef[] = useMemo(
    () => [
      {
        headerName: t('Deploy Date'),
        field: 'depn_dt',
        width: 200,
      },
      { headerName: t('Deploy version'), field: 'ver_id' },
      { headerName: t('Deploy User'), field: 'depn_usr_id' },
      { headerName: t('Memo'), field: 'depn_memo', flex: 1 },
    ],
    [t],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <Modal open={isOpen} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: 1400,
          height: '60vh',
          bgcolor: 'background.paper',
          boxShadow: 24,
          borderRadius: 2,
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        {loading && <AppLoadingOverlay loading={loading} />}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            {t('Deploy History List')}
          </Typography>
          <Button variant="outlined" size="small" onClick={onClose}>
            {t('Close')}
          </Button>
        </Box>
        <SectionArea>
          <Typography variant="subtitle1" component="h1" fontWeight="bold">
            {t('Deploy History List')}
            <Box component="span">({totalCount})</Box>
          </Typography>

          <Box
            sx={{
              p: 0,
              width: '100%',
              height: '83%',
            }}
          >
            <AgGridReact
              {...defaultGridOptions}
              enableRowPinning={false}
              context={{ highlightReadOnly: false }}
              rowData={rowData}
              columnDefs={columnDefs}
              noRowsOverlayComponentParams={{
                message: t('No Router data'),
              }}
              onRowDoubleClicked={handleSelectDeployHistory}
            />

            <GridPagination
              currentPage={paginationModel.page}
              totalCount={totalCount}
              pageSize={paginationModel.pageSize}
              pageSizeOptions={[50, 100, 200, 500]}
              onPaginationChange={onPaginationChange}
            />
          </Box>
        </SectionArea>
      </Box>
    </Modal>
  );
};

export default DeployHistoryListModal;
