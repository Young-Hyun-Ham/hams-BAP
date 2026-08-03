import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, Checkbox, Button } from '@mui/material';

import styles from '../SideBar.module.css';
import {
  TreeItem,
  fetchTreeData,
  toggleExpand,
  toggleCheck,
  expandAll,
  buildTreeFromVisualizationData,
} from '../data/treeData';
import { VisualizationDataRes } from '@/lib/types/graph';

interface LeftSidebarProps {
  visualizationData?: VisualizationDataRes | null;
  isTreeLoading?: boolean;
  treeData?: TreeItem[];
  setTreeData?: React.Dispatch<React.SetStateAction<TreeItem[]>>;
}

/**
 * Left sidebar: collapsible tree category navigator with search filter and check filter.
 */
const LeftSidebar = ({
  visualizationData,
  isTreeLoading = false,
  treeData = [],
  setTreeData = () => {},
}: LeftSidebarProps) => {
  const { t } = useTranslation();

  const [filterText, setFilterText] = useState('');
  const [checkFilterOn, setCheckFilterOn] = useState(false);

  React.useEffect(() => {
    if (!visualizationData && !isTreeLoading && treeData.length === 0) {
      // Fallback if no visualizationData is loaded yet and loading has stopped
      const loadFallback = async () => {
        try {
          const data = await fetchTreeData();
          setTreeData(data);
        } catch (err) {
          console.error('Failed to load fallback tree data:', err);
        }
      };
      loadFallback();
    }
  }, [visualizationData, isTreeLoading, treeData.length, setTreeData]);

  // ─── Handlers ───────────────────────────────────────────────

  const handleExpandAll = () => setTreeData((data) => expandAll(data));
  const handleToggleCheckFilter = () => setCheckFilterOn((v) => !v);
  const handleFilter = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFilterText(e.target.value);

  // ─── Tree renderer ──────────────────────────────────────────

  const renderTree = (items: TreeItem[], depth = 0): React.ReactNode[] =>
    items.map((item: TreeItem) => {
      const text = filterText.trim().toLowerCase();
      const labelMatch = item.label.toLowerCase().includes(text);

      const childMatches = (children: TreeItem[]): boolean =>
        children.some(
          (c) =>
            c.label.toLowerCase().includes(text) ||
            (c.children && c.children.length > 0 && childMatches(c.children)),
        );

      const hasDescendantChecked = (node: TreeItem): boolean => {
        if (node.checked) return true;
        return node.children.some(hasDescendantChecked);
      };

      const visible = !text || labelMatch || childMatches(item.children);
      if (checkFilterOn && !hasDescendantChecked(item)) return null;
      if (!visible) return null;

      return (
        <Box
          key={item.id}
          className={`tree-node depth-${depth}`}
          sx={{ userSelect: 'none' }}
        >
          <Box
            className="tree-item"
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: 0.5,
              py: 0.5,
              cursor: 'pointer',
              position: 'relative',
              maxHeight: 24,
            }}
            onClick={() => setTreeData((data) => toggleExpand(data, item.id))}
          >
            {/* Indent */}
            <Box sx={{ width: depth * 14 + 4 }} />
            {/* Toggle icon */}
            {item.children && item.children.length > 0 && (
              <Box
                sx={{
                  width: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9ba0bc',
                  fontSize: 24,
                  cursor: 'pointer',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setTreeData((data) => toggleExpand(data, item.id));
                }}
              >
                {item.expanded !== false ? '▾' : '▸'}
              </Box>
            )}
            {/* Checkbox */}
            <Box
              sx={{
                width: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: 0.25,
              }}
            >
              <Checkbox
                size="small"
                checked={item.checked}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  e.stopPropagation();
                  const checked = e.target.checked;
                  setTreeData((data) => toggleCheck(data, item.id, checked));
                  if (typeof window !== 'undefined' && window.dispatchEvent) {
                    window.dispatchEvent(
                      new CustomEvent('sidebar-toast', {
                        detail: {
                          message: checked ? '☑ 노드 표시됨' : '☐ 노드 숨김',
                          type: 'info',
                        },
                      }),
                    );
                  }
                }}
                sx={{
                  p: 0,
                  color: '#6c63ff',
                  '&.Mui-checked': { color: '#6c63ff' },
                }}
              />
            </Box>
            {/* Label with highlight */}
            <Typography
              className="item-label"
              sx={{
                flex: 1,
                fontWeight: depth === 0 ? 600 : 500,
                fontSize: depth === 0 ? 13 : depth === 1 ? 12 : 11,
                color:
                  depth === 0 ? '#1e2140' : depth === 1 ? '#4b5bab' : '#5c6080',
                pl: 0.25,
                pr: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={item.label}
            >
              {text ? (
                <>
                  {item.label
                    .split(new RegExp(`(${text})`, 'gi'))
                    .map((part, i) =>
                      part.toLowerCase() === text ? (
                        <span
                          key={i}
                          style={{ background: '#ffe082', color: '#222' }}
                        >
                          {part}
                        </span>
                      ) : (
                        part
                      ),
                    )}
                </>
              ) : (
                item.label
              )}
            </Typography>
            {/* Badge */}
            {item.code && (
              <Box
                className={`item-badge ${styles[`badge-${item.code.toLowerCase()}`]}`}
                sx={{
                  ml: 0.5,
                  color: '#fff',
                  borderRadius: 1,
                  fontSize: 10,
                  fontWeight: 600,
                  px: 1,
                  py: 0.2,
                }}
              >
                {item.code}
              </Box>
            )}
          </Box>
          {/* Children */}
          {item.children &&
            item.children.length > 0 &&
            item.expanded !== false && (
              <Box className="tree-children" sx={{ ml: 1 }}>
                {renderTree(item.children, depth + 1)}
              </Box>
            )}
        </Box>
      );
    });

  // ─── Render ─────────────────────────────────────────────────

  return (
    <Box
      sx={{
        width: 260,
        height: '100%',
        bgcolor: 'white',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #dde1f0',
        minWidth: 220,
      }}
    >
      {/* Header */}
      <Box
        className="sidebar-header"
        sx={{
          p: 1,
          borderBottom: '1px solid #dde1f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography
          className="sidebar-title"
          sx={{
            fontSize: 11,
            fontWeight: 600,
            color: '#5c6080',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {t('Graph Category')}
        </Typography>
        <Box className="sidebar-actions" sx={{ display: 'flex', gap: 1 }}>
          <Button
            className="sb-btn"
            size="small"
            variant="outlined"
            sx={{
              fontSize: 10,
              px: 1,
              py: 0.5,
              border: '1px solid #dde1f0',
              minWidth: 0,
            }}
            onClick={handleExpandAll}
          >
            {t('All')}
          </Button>
          <Button
            className={`sb-btn${checkFilterOn ? ' active' : ''}`}
            variant="outlined"
            size="small"
            sx={{
              fontSize: 10,
              px: 1,
              py: 0.5,
              border: '1px solid #dde1f0',
              color: checkFilterOn ? '#6c63ff' : '#5c6080',
              bgcolor: checkFilterOn ? 'rgba(108,99,255,0.15)' : undefined,
              minWidth: 0,
            }}
            onClick={handleToggleCheckFilter}
          >
            {checkFilterOn ? t('☑ Only') : t('All')}
          </Button>
        </Box>
      </Box>
      {/* Filter Bar */}
      <Box
        className="filter-bar"
        sx={{
          p: 1,
          borderBottom: '1px solid #dde1f0',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <input
          type="text"
          value={filterText}
          onChange={handleFilter}
          placeholder="Filter..."
          style={{
            flex: 1,
            border: '1px solid #dde1f0',
            borderRadius: 4,
            padding: '4px 8px',
            fontSize: 11,
            outline: 'none',
            fontFamily: 'inherit',
            color: '#1a1d36',
          }}
        />
      </Box>
      {/* Tree */}
      <Box className="tree" sx={{ flex: 1, overflowY: 'auto', p: '4px 0 8px' }}>
        {isTreeLoading && treeData.length === 0 ? (
          <Typography
            variant="caption"
            sx={{
              p: 2,
              color: 'text.secondary',
              display: 'block',
              textAlign: 'center',
            }}
          >
            {t('Loading tree...')}
          </Typography>
        ) : (
          renderTree(treeData)
        )}
      </Box>
    </Box>
  );
};

export default React.memo(LeftSidebar);
