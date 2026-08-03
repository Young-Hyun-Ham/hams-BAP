'use client';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Typography, alpha, useMediaQuery, useTheme } from '@mui/material';
import { ReactFlowProvider, Node, useStore, useReactFlow } from '@xyflow/react';
import { Info, Layout } from 'lucide-react';

import FlowCanvas from './FlowCanvas';
import { Sidebar } from './Sidebar';
import { graphService, graphStyleService } from '@/lib/api/services';
import { VisualizationDataRes } from '@/lib/types/graph';
import {
  TreeItem,
  buildTreeFromVisualizationData,
  getTreeNodesState,
} from './data/treeData';
import { useGraphStore } from './store/useGraphStore';
import { useGraphStyles, getNodePrefix } from './useGraphStyles';
import { GraphEditorMode } from '@/lib/types/graph';
import useAlert from '@/lib/hooks/useAlert';

export interface InitialNodeTarget {
  docuFilId: string;
  nodeId: string;
  tenId?: string;
  stgId?: string;
  taskId: string;
  wfPrcsId: string;
}

interface GraphEditorInnerProps {
  mode: GraphEditorMode;
  initialTargets?: InitialNodeTarget[];
}

const GraphEditorInner = ({ mode, initialTargets }: GraphEditorInnerProps) => {
  const theme = useTheme();
  const { showSnackbar } = useAlert();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  const [rightSidebarTab, setRightSidebarTab] = useState<
    'info' | 'chunks' | 'edit'
  >('info');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [leftCollapsed, setLeftCollapsed] = useState(isMobile);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const { t } = useTranslation();

  const [visualizationData, setVisualizationData] =
    useState<VisualizationDataRes | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [treeData, setTreeData] = useState<TreeItem[]>([]);

  const { setNodes, setEdges, getEdges } = useReactFlow();
  const { nodeTypeStyles } = useGraphStyles();

  const handleNodeModified = useCallback(
    (id: string, properties: Record<string, any>) => {
      useGraphStore.getState().trackNodeModified(id, properties);

      setNodes((nds) =>
        nds.map((node: any) => {
          if (node.id === id) {
            const updatedNode = {
              ...node,
              data: {
                ...node.data,
                ...properties,
                label: properties.name || properties.label || node.data.label,
              },
            };

            if (properties.type) {
              const prefix = getNodePrefix(properties.type);
              updatedNode.type = prefix;
              const style =
                nodeTypeStyles[prefix] || nodeTypeStyles['Default'] || {};
              updatedNode.data.nodeBgColor = style.bg;
              updatedNode.data.nodeBorder = style.border;
              updatedNode.data.nodeColor = style.color;
            }

            return updatedNode;
          }
          return node;
        }),
      );
    },
    [setNodes, nodeTypeStyles],
  );

  const handleNodeDeleted = useCallback(
    (id: string) => {
      const edges = getEdges();
      const connectedEdgeIds = edges
        .filter((e) => e.source === id || e.target === id)
        .map((e) => e.id);

      useGraphStore.getState().trackNodeDeleted(id, connectedEdgeIds);

      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    },
    [setNodes, setEdges, getEdges],
  );

  const getVisualizationParams = useCallback(
    () => (mode === 'popup' ? { node_label: ['L1', 'L2', 'L3', 'L4'] } : {}),
    [mode],
  );

  const loadGraphData = useCallback(
    async (showLoading = true) => {
      if (showLoading) setIsLoading(true);
      try {
        const data = await graphService.getVisualizationData(
          getVisualizationParams(),
        );
        setVisualizationData(data);
        setTreeData((prevTree) =>
          buildTreeFromVisualizationData(data, prevTree),
        );
      } catch (error) {
        console.error('Failed to fetch graph visualization data:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [getVisualizationParams],
  );

  useEffect(() => {
    let ignore = false;
    const initData = async () => {
      try {
        const [data, styleConfig] = await Promise.all([
          graphService.getVisualizationData(getVisualizationParams()),
          graphStyleService.getGraphStyleConfig(mode),
        ]);
        if (!ignore) {
          setVisualizationData(data);
          setTreeData(buildTreeFromVisualizationData(data));
          useGraphStore.getState().initStyles(styleConfig);
        }
      } catch (error) {
        console.error('Failed to fetch graph data or style config:', error);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };
    initData();
    return () => {
      ignore = true;
    };
  }, []);

  // Pre-select initial nodes so they appear picked by default and can be Ctrl+Clicked to deselect.
  useEffect(() => {
    if (!initialTargets?.length || !visualizationData) return;
    // Reset picked selection before re-populating from new initialTargets
    useGraphStore.getState().clearPopupSelectedNodes();
    for (const { docuFilId, nodeId } of initialTargets) {
      const found = visualizationData.nodes.find(
        (n) =>
          n.properties.docu_fil_id === docuFilId &&
          n.properties.node_id === nodeId,
      );
      if (found) {
        // Pre-populate into picked set so they appear selected and can be toggled off
        useGraphStore.getState().togglePopupSelectedNode({
          id: found.id,
          type: found.label,
          data: found.properties as Record<string, any>,
        });
      }
    }
  }, [visualizationData, initialTargets]);

  const { allTreeNodeIds, checkedNodeIds } = useMemo(
    () => getTreeNodesState(treeData),
    [treeData],
  );

  // Derived selected node using a custom Zustand selector to prevent re-renders when node position changes during drag
  const selectedNode = useStore(
    useCallback(
      (state: any) => {
        const node = state.nodes.find((n: any) => n.id === selectedNodeId);
        if (!node) return null;
        return {
          id: node.id,
          type: node.type,
          data: node.data,
        };
      },
      [selectedNodeId],
    ),
    useCallback((oldNode: any, newNode: any) => {
      if (!oldNode && !newNode) return true;
      if (!oldNode || !newNode) return false;
      return (
        oldNode.id === newNode.id &&
        oldNode.type === newNode.type &&
        oldNode.data === newNode.data
      );
    }, []),
  );

  // In popup mode, Ctrl+Click toggles a node into/out of the picked set.
  const handleNodeCtrlClick = useCallback(
    (node: Node) => {
      if (mode !== 'popup') return;
      if (node.type && ['L1', 'L2'].includes(node.type)) {
        showSnackbar('error', t('You cannot select L1 or L2 nodes'));
        return;
      }
      useGraphStore.getState().togglePopupSelectedNode({
        id: node.id,
        type: node.type,
        data: node.data as Record<string, any>,
      });
    },
    [mode],
  );

  // Clear popup state on unmount (popup closed)
  useEffect(() => {
    if (mode !== 'popup') return;
    return () => {
      useGraphStore.getState().clearPopupSelectedNodes();
    };
  }, [mode]);

  // Auto-collapse on resize
  const [prevIsMobile, setPrevIsMobile] = useState(isMobile);
  const [prevIsTablet, setPrevIsTablet] = useState(isTablet);

  if (isMobile !== prevIsMobile || isTablet !== prevIsTablet) {
    setPrevIsMobile(isMobile);
    setPrevIsTablet(isTablet);
    if (isMobile) {
      setLeftCollapsed(true);
      setRightCollapsed(true);
    } else if (isTablet) {
      setLeftCollapsed(false);
      setRightCollapsed(true);
    } else {
      setLeftCollapsed(false);
      setRightCollapsed(false);
    }
  }

  // When a node is selected on mobile, show the right sidebar
  const [prevSelectedNodeId, setPrevSelectedNodeId] = useState(
    selectedNode?.id,
  );

  if (selectedNode?.id !== prevSelectedNodeId) {
    setPrevSelectedNodeId(selectedNode?.id);
    if (selectedNode && isMobile) {
      setRightCollapsed(false);
      setLeftCollapsed(true);
    }
  }

  const toggleLeft = useCallback(() => setLeftCollapsed((c) => !c), []);
  const toggleRight = useCallback(() => setRightCollapsed((c) => !c), []);

  const handleTabChange = useCallback(
    (tab: 'info' | 'chunks' | 'edit' | null) => {
      if (tab) setRightSidebarTab(tab);
    },
    [],
  );

  const handleNodeSelect = useCallback(
    (node: Node | null, tab?: 'info' | 'chunks' | 'edit' | null) => {
      setSelectedNodeId(node ? node.id : null);
      if (tab && tab !== 'info') {
        setRightSidebarTab(tab);
      }

      if (node && !isMobile) {
        setRightCollapsed(false);
      }
    },
    [isMobile],
  );

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        bgcolor: '#f8fafc',
        border: `1px solid ${theme.palette.grey[200]}`,
      }}
    >
      {/* Content Area */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {isMobile && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Box
              onClick={toggleLeft}
              sx={{
                p: 1,
                borderRadius: '6px',
                bgcolor: !leftCollapsed ? alpha('#4f46e5', 0.1) : 'transparent',
                cursor: 'pointer',
              }}
            >
              <Layout
                size={20}
                color={!leftCollapsed ? '#4f46e5' : '#64748b'}
              />
            </Box>
            <Box
              onClick={toggleRight}
              sx={{
                p: 1,
                borderRadius: '6px',
                bgcolor: !rightCollapsed
                  ? alpha('#4f46e5', 0.1)
                  : 'transparent',
                cursor: 'pointer',
              }}
            >
              <Info size={20} color={!rightCollapsed ? '#4f46e5' : '#64748b'} />
            </Box>
          </Box>
        )}
        {/* Left Sidebar Container */}
        <Box
          sx={{
            width: leftCollapsed ? 0 : 280,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            position: isMobile ? 'absolute' : 'relative',
            height: '100%',
            zIndex: isMobile ? 1001 : 10,
            left: 0,
            bgcolor: 'white',
            borderRight: leftCollapsed ? 'none' : '1px solid #e2e8f0',
            transform:
              isMobile && leftCollapsed ? 'translateX(-100%)' : 'translateX(0)',
            boxShadow:
              isMobile && !leftCollapsed
                ? '10px 0 30px rgba(0,0,0,0.05)'
                : 'none',
          }}
        >
          <Sidebar
            type="left"
            onClose={toggleLeft}
            visualizationData={visualizationData}
            isTreeLoading={isLoading}
            treeData={treeData}
            setTreeData={setTreeData}
          />
        </Box>

        {/* Left Toggle Button (Desktop Only) */}
        {!isMobile && (
          <Box
            onClick={toggleLeft}
            sx={{
              position: 'absolute',
              left: leftCollapsed ? 12 : 268,
              top: 16,
              zIndex: 20,
              width: 24,
              height: 24,
              bgcolor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              transition:
                'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s',
              '&:hover': { transform: 'scale(1.1)', bgcolor: '#f8fafc' },
            }}
          >
            <Typography
              sx={{ fontSize: '16px', fontWeight: 700, color: '#64748b' }}
            >
              {leftCollapsed ? t('›') : t('‹')}
            </Typography>
          </Box>
        )}
        {/* Main Flow Area */}
        <Box sx={{ flex: 1, position: 'relative', zIndex: 1 }}>
          <FlowCanvas
            onNodeSelect={handleNodeSelect}
            onNodeCtrlClick={handleNodeCtrlClick}
            visualizationData={visualizationData}
            onRefresh={loadGraphData}
            isDataLoading={isLoading}
            checkedNodeIds={checkedNodeIds}
            allTreeNodeIds={allTreeNodeIds}
            mode={mode}
          />
        </Box>

        {/* Right Toggle Button (Desktop Only) */}
        {!isMobile && (
          <Box
            onClick={toggleRight}
            sx={{
              position: 'absolute',
              right: rightCollapsed ? 12 : 412,
              top: 16,
              zIndex: 20,
              width: 24,
              height: 24,
              bgcolor: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 1,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              transition:
                'right 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s',
              '&:hover': { transform: 'scale(1.1)', bgcolor: '#f8fafc' },
            }}
          >
            <Typography
              sx={{ fontSize: '16px', fontWeight: 700, color: '#64748b' }}
            >
              {rightCollapsed ? t('‹') : t('›')}
            </Typography>
          </Box>
        )}
        {/* Right Sidebar Container */}
        <Box
          sx={{
            width: rightCollapsed ? 0 : { xs: '85vw', sm: 420 },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            position: isMobile ? 'absolute' : 'relative',
            height: '100%',
            zIndex: isMobile ? 1001 : 10,
            right: 0,
            bgcolor: 'white',
            border: '1px solid #e2e8f0',
            mr: 1,
            borderLeft: rightCollapsed ? 'none' : '1px solid #e2e8f0',
            transform:
              isMobile && rightCollapsed ? 'translateX(100%)' : 'translateX(0)',
            boxShadow:
              isMobile && !rightCollapsed
                ? '-10px 0 30px rgba(0,0,0,0.05)'
                : 'none',
          }}
        >
          <Sidebar
            type="right"
            mode={mode}
            selectedNode={selectedNode}
            onClose={toggleRight}
            activeTab={rightSidebarTab}
            onTabChange={handleTabChange}
            onNodeModified={handleNodeModified}
            onNodeDeleted={handleNodeDeleted}
          />
        </Box>
      </Box>
    </Box>
  );
};

interface GraphEditorProps {
  mode?: GraphEditorMode;
  initialTargets?: InitialNodeTarget[];
}

const GraphEditor = ({ mode = 'main', initialTargets }: GraphEditorProps) => (
  <ReactFlowProvider>
    <GraphEditorInner mode={mode} initialTargets={initialTargets} />
  </ReactFlowProvider>
);

export default GraphEditor;
