import { FormControl, MenuItem, Select } from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Play,
  Redo,
  Save,
  SendIcon,
  Sparkles,
  Square,
  Undo,
} from 'lucide-react';
import { RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { Panel } from 'reactflow';

import { MOCK_UP_TREE_DATA } from '../../../store';
import { TreeItem } from '../../../types/types';
import styles from '../FlowCanvas.module.css';

const nodeLabels = {
  message: '+ Message',
  form: '+ Form',
  branch: '+ Condition Branch',
  slotfilling: '+ SlotFilling',
  api: '+ API',
  llm: '+ LLM',
  setSlot: '+ Set Slot',
  delay: '+ Delay',
  fixedmenu: '+ Fixed Menu',
  link: '+ Link',
  toast: '+ Toast',
  iframe: '+ iFrame',
  scenario: '+ Scenario Group',
} as any;

type FlowCanvasToolbarProps = {
  searchPanelRef: RefObject<HTMLDivElement | null>;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSaveScenario: () => Promise<void>;
  onPushScenario: () => Promise<void>;
  isSimulatorVisible: boolean;
  onToggleSimulator: () => void;
  executionRunning: boolean;
  onRun: () => void;
  onStop: () => void;
  onShowCurrentValues: () => void;
  searchType: string;
  onSearchTypeChange: (value: string) => void;
  searchKeyword: string;
  onSearchKeywordChange: (value: string) => void;
  filteredSearchResults: any[];
  onFocusNode: (node: any) => void;
  getNodeSearchText: (node: any) => unknown[];
};

export default function FlowCanvasToolbar({
  searchPanelRef,
  isCollapsed,
  onToggleCollapsed,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSaveScenario,
  onPushScenario,
  isSimulatorVisible,
  onToggleSimulator,
  executionRunning,
  onRun,
  onStop,
  onShowCurrentValues,
  searchType,
  onSearchTypeChange,
  searchKeyword,
  onSearchKeywordChange,
  filteredSearchResults,
  onFocusNode,
  getNodeSearchText,
}: FlowCanvasToolbarProps) {
  const { t } = useTranslation();

  return (
    <Panel position="top-left">
      <div
        ref={searchPanelRef}
        className={`${styles.searchPanel} ${
          isCollapsed ? styles.searchPanelCollapsed : ''
        }`}
      >
        <div className={styles.searchTopRow}>
          <div className={styles.toolRow}>
            <button
              type="button"
              onClick={onUndo}
              title={`${t('Undo')} (Ctrl/Cmd+Z)`}
              className={styles.toolButton}
              disabled={!canUndo}
            >
              <Undo size={18} />
            </button>

            <button
              type="button"
              onClick={onRedo}
              title={`${t('Redo')} (Ctrl+Y, Cmd+Shift+Z)`}
              className={styles.toolButton}
              disabled={!canRedo}
            >
              <Redo size={18} />
            </button>

            <button
              type="button"
              onClick={onSaveScenario}
              title={`${t('Commit & Save Scenario')}`}
              className={styles.toolButton}
            >
              <Save size={18} />
            </button>

            <button
              type="button"
              onClick={onPushScenario}
              title={t('Push Scenario')}
              className={styles.toolButton}
            >
              <SendIcon size={18} />
            </button>

            <div className={styles.toolSeparator}>|</div>

            <button
              type="button"
              title={t('Show chatbot simulator')}
              onClick={onToggleSimulator}
              className={`${styles.toolButton} ${
                isSimulatorVisible ? styles.toolButtonActive : ''
              }`}
            >
              <Sparkles size={18} />
            </button>

            <div className={styles.toolSeparator}>|</div>

            <button
              type="button"
              title={t('Run from Start to Anchor')}
              onClick={onRun}
              className={`${styles.toolButton} ${
                executionRunning ? styles.toolButtonActive : ''
              }`}
              disabled={executionRunning}
            >
              <Play size={18} />
            </button>

            <button
              type="button"
              title={t('Stop execution')}
              onClick={onStop}
              className={styles.toolButton}
              disabled={!executionRunning}
            >
              <Square size={18} />
            </button>

            <button
              type="button"
              title={t('Current Values')}
              onClick={onShowCurrentValues}
              className={styles.toolButton}
            >
              <FileText size={18} />
            </button>

            <div className={styles.toolSeparator}>|</div>
          </div>

          <div className={styles.searchRow}>
            <FormControl size="small">
              <Select
                value={searchType}
                onChange={(event) => onSearchTypeChange(event.target.value)}
                className={styles.searchSelect}
                sx={{
                  height: '40px',
                  backgroundColor: '#fff',
                  fontSize: '12px',
                  '& .MuiSelect-select': {
                    paddingTop: '0px',
                    paddingBottom: '0px',
                    display: 'flex',
                    alignItems: 'center',
                  },
                }}
                MenuProps={{
                  disablePortal: false,
                }}
              >
                <MenuItem value="all" sx={{ fontSize: '12px' }}>
                  {t('All')}
                </MenuItem>
                {MOCK_UP_TREE_DATA[0].children.map((item: TreeItem) => (
                  <MenuItem
                    key={item.id}
                    value={item.id}
                    sx={{ fontSize: '12px' }}
                  >
                    {item.id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <input
              className={styles.searchInput}
              type="text"
              value={searchKeyword}
              onChange={(event) => onSearchKeywordChange(event.target.value)}
              placeholder={t('Search node message text')}
            />
          </div>

          <button
            type="button"
            title={
              isCollapsed
                ? `${t('Show canvas panel')}`
                : `${t('Hide canvas panel')}`
            }
            onClick={onToggleCollapsed}
            className={`${styles.toolButton} ${styles.panelToggleButton}`}
          >
            {isCollapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>
        </div>

        {!isCollapsed && filteredSearchResults.length > 0 && (
          <div className={styles.searchResults}>
            {filteredSearchResults.map((node: any) => (
              <div
                key={node.id}
                className={styles.searchResultCard}
                onClick={() => onFocusNode(node)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    onFocusNode(node);
                  }
                }}
              >
                <div className={styles.searchResultHeader}>
                  <div className={styles.searchResultType}>
                    {nodeLabels[node.type]?.replace('+ ', '') || node.type}
                  </div>
                  <div className={styles.searchResultId}>{node.id}</div>
                </div>

                <div className={styles.searchResultText}>
                  {getNodeSearchText(node).filter(Boolean).join(' ') ||
                    '(empty)'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}
