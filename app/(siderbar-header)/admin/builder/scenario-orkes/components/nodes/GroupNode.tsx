import { ChevronsUpDown, UnfoldVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import styles from './ChatNodes.module.css';
import { useBuilderStore } from '../../../store';
import NodeWrapper from './NodeWrapper';
import { FLOW_NODE_SIZES } from '../../constants/nodeSizes';

import type { NodeProps } from 'reactflow';

type GroupNodeData = {
  label?: string;
  title?: string;
  flowCollapsed?: boolean;
  flowGroupHeight?: number;
  flowGroupWidth?: number;
};

function GroupNode({ id, data }: NodeProps<GroupNodeData>) {
  const { t } = useTranslation();
  const nodes = useBuilderStore((state) => state.nodes);
  const setNodes = useBuilderStore((state) => state.setNodes);

  const title = data?.label || data?.title || 'Selected Group';
  const updateDescendantCollapsed = (collapsed: boolean) => {
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const isGroupDescendant = (nodeId: string) => {
      let parentId = nodeById.get(nodeId)?.parentNode;

      while (parentId) {
        if (parentId === id) return true;
        parentId = nodeById.get(parentId)?.parentNode;
      }

      return false;
    };

    setNodes(
      nodes.map((node) =>
        isGroupDescendant(node.id)
          ? {
              ...node,
              data: {
                ...(node.data ?? {}),
                flowCollapsed: collapsed,
              },
            }
          : node,
      ),
    );
  };

  const headerButtons = (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          updateDescendantCollapsed(false);
        }}
        className={styles.anchorButton}
        title={t('All Expand')}
      >
        <ChevronsUpDown size={14} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          updateDescendantCollapsed(true);
        }}
        className={styles.anchorButton}
        title={t('All Collapse')}
      >
        <UnfoldVertical size={14} />
      </button>
    </>
  );

  return (
    <NodeWrapper
      id={id}
      typeLabel={`${t('Group')}: ${title}`}
      icon={null}
      nodeColor="#475569"
      textColor="#ffffff"
      headerButtons={headerButtons}
      customClassName={`${styles.groupNodeWrapper} ${data?.flowCollapsed ? styles.groupNodeCollapsed : ''}`}
      style={{
        width: data?.flowGroupWidth || FLOW_NODE_SIZES.groupMinWidth,
        minHeight: data?.flowCollapsed
          ? undefined
          : data?.flowGroupHeight || 260,
      }}
    >
      <p className={styles.groupNodeDescription}>
        {t('This group contains selected nodes from the current scenario')}.
      </p>
    </NodeWrapper>
  );
}

export default GroupNode;
