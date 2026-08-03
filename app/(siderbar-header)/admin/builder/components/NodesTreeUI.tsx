'use client';

import {
  Box,
  FormControlLabel,
  IconButton,
  Switch,
  Typography,
} from '@mui/material';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import NodesTree from './NodesTree';
import { MOCK_UP_TREE_DATA } from '../store';

import { COLORS } from '@/lib/constants/color';
import LeftPanelOpenIcon from '@/assets/icon-left-panel-open.svg';
import LeftPanelCloseIcon from '@/assets/icon-left-panel-close.svg';
// import LeftPanelCloseIcon from '@/assets/icon-left-panel-close.svg';

// [인수인계 메모]
// - 역할: 좌측 카테고리 메뉴 트리 렌더링.
function NodesTreeUI({
  props,
  onScenarioGroupClick,
  onNodesSettingClick,
}: any) {
  const { t } = useTranslation();
  const [isDragMode, setIsDragMode] = useState(true);
  const [isUserCollapsed, setIsUserCollapsed] = useState(false);
  const isMenuCollapsed =
    props?.isCollapsed !== undefined
      ? props.isCollapsed
      : Boolean(props?.isMenuView) || isUserCollapsed;

  return (
    <Box
      aria-label="Nodes Tree"
      aria-expanded={!isMenuCollapsed}
      borderRight={1}
      borderColor={COLORS.blueGrey[100]}
      width={isMenuCollapsed ? '46px' : '264px'}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0,
        transition: 'width 240ms ease-in-out',
        willChange: 'width',
      }}
    >
      <Box
        display={'flex'}
        alignItems={'center'}
        gap={0.5}
        px={0.5}
        py={1}
        borderBottom={isMenuCollapsed ? 0 : 1}
        borderColor={COLORS.blueGrey[100]}
      >
        <IconButton
          aria-label={
            isMenuCollapsed ? 'Expand Nodes Tree' : 'Collapse Nodes Tree'
          }
          onClick={() => {
            if (props?.onToggleCollapse) {
              props.onToggleCollapse(!isMenuCollapsed);
            } else {
              setIsUserCollapsed((prev) => !prev);
            }
          }}
        >
          {/* {isMenuCollapsed ? <LeftPanelOpenIcon /> : <LeftPanelCloseIcon />} */}
        </IconButton>
        <Typography
          fontSize={14}
          fontWeight={500}
          color="text.primary"
          sx={{
            transition: 'opacity 200ms ease, transform 200ms ease',
            opacity: isMenuCollapsed ? 0 : 1,
            transform: isMenuCollapsed ? 'translateX(-4px)' : 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {t('Node Library')}
        </Typography>
        <Box flex={0.5} />
        <Box display={'flex'} alignItems={'center'} gap={0.5}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={isDragMode}
                onChange={(_, checked) => setIsDragMode(checked)}
                // disabled={selectedChunk != null}
              />
            }
            label={t('Drag & Drop')}
            sx={{
              mr: 0,
              '& .MuiFormControlLabel-label': {
                fontSize: 12,
                fontWeight: 500,
                color: 'text.primary',
              },
            }}
          />
        </Box>
      </Box>
      <Box
        sx={{
          flex: 1,
          width: '264px',
          minWidth: '264px',
          overflowY: 'auto',
          overflowX: 'hidden',
          transition: 'opacity 200ms ease, transform 200ms ease',
          willChange: 'transform, opacity',
          opacity: isMenuCollapsed ? 0 : 1,
          transform: isMenuCollapsed ? 'translateX(-218px)' : 'none',
          pointerEvents: isMenuCollapsed ? 'none' : 'auto',
        }}
        aria-hidden={isMenuCollapsed}
      >
        <NodesTree
          data={MOCK_UP_TREE_DATA}
          isDragMode={isDragMode}
          onScenarioGroupClick={onScenarioGroupClick}
          onNodesSettingClick={onNodesSettingClick}
        />
      </Box>
    </Box>
  );
}

export default memo(NodesTreeUI);
