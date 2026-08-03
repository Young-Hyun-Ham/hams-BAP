import { Handle, Position } from 'reactflow';
import { useEffect, useMemo, useState } from 'react';

import styles from './ChatNodes.module.css';
import { useBuilderStore } from '../../../store';
import { builderExecutionStore } from '../../../store/builderExecutionStore';
import { AnchorIcon, StartNodeIcon } from '../icons/Icons';

import { Loader2, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const getNodeIdsToRemove = (nodes, edges, nodeId) => {
  const removeSet = new Set();
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const outgoingEdgesBySourceId = new Map();

  edges.forEach((edge) => {
    outgoingEdgesBySourceId.set(edge.source, [
      ...(outgoingEdgesBySourceId.get(edge.source) || []),
      edge,
    ]);
  });

  const collectNodeAndChildren = (targetId) => {
    if (removeSet.has(targetId)) return;

    const targetNode = nodeById.get(targetId);
    if (!targetNode) return;

    removeSet.add(targetId);

    if (
      targetNode.type === 'scenario' ||
      targetNode.type === 'selectionGroup'
    ) {
      nodes
        .filter((child) => child.parentNode === targetId)
        .forEach((child) => collectNodeAndChildren(child.id));
    }

    if (targetNode.type === 'branch') {
      outgoingEdgesBySourceId
        .get(targetId)
        ?.forEach((edge) => collectBranchDescendant(edge.target));
    }
  };

  const collectBranchDescendant = (targetId) => {
    if (removeSet.has(targetId)) return;

    collectNodeAndChildren(targetId);

    outgoingEdgesBySourceId
      .get(targetId)
      ?.forEach((edge) => collectBranchDescendant(edge.target));
  };

  collectNodeAndChildren(nodeId);

  return removeSet;
};
/**
 * 모든 노드에서 공통으로 사용되는 래퍼 컴포넌트입니다.
 * 헤더, 버튼(시작, 앵커, 삭제), 공통 스타일, 기본 핸들을 관리합니다.
 *
 * @param {object} props
 * @param {string} props.id - 노드 ID
 * @param {string} props.typeLabel - 헤더에 표시될 노드 타입 (예: "Message")
 * @param {React.ReactNode} props.icon - 헤더에 표시될 아이콘
 * @param {string} props.nodeColor - 노드 헤더 배경색
 * @param {string} props.textColor - 노드 헤더 텍스트/아이콘 색상
 * @param {React.ReactNode} props.children - 노드의 본문(body) 컨텐츠
 * @param {React.ReactNode} [props.handles=null] - (선택) 커스텀 핸들 (제공 시 기본 출력 핸들 대체)
 * @param {React.ReactNode} [props.headerButtons=null] - (선택) 헤더에 추가할 커스텀 버튼 (예: ApiNode의 테스트 버튼)
 * @param {string} [props.customClassName=""] - (선택) 래퍼 div에 추가할 클래스 (예: FormNode의 너비 조절용)
 * @param {object} [props.style={}] - (선택) 래퍼 div에 적용할 인라인 스타일 (예: IframeNode의 동적 너비)
 * @param {boolean} [props.collapseContentOnHeader=true] - header click collapses the body when true.
 */
function NodeWrapper({
  id,
  typeLabel,
  icon,
  nodeColor,
  textColor,
  children,
  handles = null,
  headerButtons = null,
  customClassName = '',
  style = {},
  collapseContentOnHeader = true,
}) {
  const { t } = useTranslation();
  const deleteNode = useBuilderStore((state) => state.deleteNode);
  const anchorNodeId = useBuilderStore((state) => state.anchorNodeId);
  const setAnchorNodeId = useBuilderStore((state) => state.setAnchorNodeId);
  const startNodeId = useBuilderStore((state) => state.startNodeId);
  const setStartNodeId = useBuilderStore((state) => state.setStartNodeId);
  const updateNodeData = useBuilderStore((state) => state.updateNodeData);
  const nodes = useBuilderStore((state) => state.nodes);
  const edges = useBuilderStore((state) => state.edges);
  const flowCollapsed = useBuilderStore(
    (state) => state.nodes.find((node) => node.id === id)?.data?.flowCollapsed,
  );
  const deleteTarget = useMemo(
    () => nodes.find((node) => node.id === id),
    [id, nodes],
  );
  const childDeleteCount = useMemo(() => {
    if (
      deleteTarget?.type !== 'branch' &&
      deleteTarget?.type !== 'selectionGroup' &&
      deleteTarget?.type !== 'scenario'
    ) {
      return 0;
    }

    return Math.max(0, getNodeIdsToRemove(nodes, edges, id).size - 1);
  }, [deleteTarget?.type, edges, id, nodes]);

  const isAnchored = anchorNodeId === id;
  const isStartNode = startNodeId === id;
  const [isBodyCollapsed, setIsBodyCollapsed] = useState(false);

  // Flow UiPath insert rule: page.tsx marks existing nodes as collapsed
  // after adding a node, and the shared wrapper applies that flag to the body.
  useEffect(() => {
    if (typeof flowCollapsed === 'boolean') {
      setIsBodyCollapsed(flowCollapsed);
    }
  }, [flowCollapsed]);

  const toggleBodyCollapsed = () => {
    const nextCollapsed = !isBodyCollapsed;
    setIsBodyCollapsed(nextCollapsed);
    updateNodeData(id, { flowCollapsed: nextCollapsed });
  };

  const handleDeleteNode = (e) => {
    e.stopPropagation();

    if (childDeleteCount > 0) {
      const confirmed = window.confirm(
        t('This node has child nodes. Delete all child nodes as well?'),
      );

      if (!confirmed) return;
    }

    deleteNode(id);
  };

  // 플레이 추가
  const executionRunning = builderExecutionStore(
    (state) => state.executionRunning,
  );
  const executionCurrentNodeId = builderExecutionStore(
    (state) => state.executionCurrentNodeId,
  );
  const executionCompletedNodeIds = builderExecutionStore(
    (state) => state.executionCompletedNodeIds,
  );

  const isRunningNode = executionRunning && executionCurrentNodeId === id;
  const isCompletedNode = executionCompletedNodeIds.includes(id);

  return (
    <div
      className={`${styles.nodeWrapper} ${isAnchored ? styles.anchored : ''} ${isStartNode ? styles.startNode : ''} ${customClassName}`}
      style={{
        ...style,
        '--node-accent': nodeColor || '#5f8fb8',
        '--node-accent-text': textColor || '#ffffff',
      }}
    >
      {/* 플레이 추가 */}
      {isRunningNode ? (
        <div
          className={`${styles.executionBadge} ${styles.executionBadgeRunning}`}
        >
          <Loader2 size={16} className={styles.executionSpinner} />
        </div>
      ) : isCompletedNode ? (
        <div
          className={`${styles.executionBadge} ${styles.executionBadgeDone}`}
        >
          <CheckCircle2 size={16} />
        </div>
      ) : null}

      {/* 1. 공통 입력 핸들 */}
      <Handle type="target" position={Position.Top} />

      {/* 2. 공통 헤더 */}
      <div
        className={`${styles.nodeHeader} ${isBodyCollapsed ? styles.nodeHeaderCollapsed : ''}`}
        role="button"
        tabIndex={0}
        title={isBodyCollapsed ? t('Expand') : t('Collapse')}
        onClick={toggleBodyCollapsed}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleBodyCollapsed();
          }
        }}
      >
        <div className={styles.headerLeft}>
          <span className={styles.collapseIndicator}>
            {isBodyCollapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </span>
          {icon}
          <span className={styles.headerTextContent}>{typeLabel}</span>
        </div>
        <div className={styles.headerButtons}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setStartNodeId(id);
            }}
            className={`${styles.startNodeButton} ${isStartNode ? styles.active : ''}`}
            title={t('Set as Start Node')}
          >
            <StartNodeIcon />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setAnchorNodeId(id);
            }}
            className={`${styles.anchorButton} ${isAnchored ? styles.active : ''}`}
            title={t('Set as anchor')}
          >
            <AnchorIcon />
          </button>
          {/* 2a. 추가 헤더 버튼 */}
          {headerButtons}
          <button
            onClick={handleDeleteNode}
            className={`${styles.deleteButton}`}
            // style={{ color: textColor }}
          >
            X
          </button>
        </div>
      </div>

      {/* 3. 노드별 본문 컨텐츠 */}
      {(!collapseContentOnHeader || !isBodyCollapsed) && (
        <div className={styles.nodeBody}>{children}</div>
      )}

      {/* 4. 커스텀 핸들 또는 기본 출력 핸들 */}
      {handles ? handles : <Handle type="source" position={Position.Bottom} />}
    </div>
  );
}

export default NodeWrapper;
