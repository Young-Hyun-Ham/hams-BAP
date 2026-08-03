import { useEffect } from 'react';
import { useUpdateNodeInternals } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import styles from './ChatNodes.module.css';
import { useBuilderStore } from '../../store/index';
import { CollapseNodeIcon, ExpandNodeIcon } from '../icons/Icons';
import { Split } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import NodeWrapper from './NodeWrapper';

function GroupNode({ id, data, selected }) {
  const { t } = useTranslation();
  const updateNodeInternals = useUpdateNodeInternals();
  const toggleScenarioNode = useBuilderStore(
    (state) => state.toggleScenarioNode,
  );
  const ungroupNode = useBuilderStore((state) => state.ungroupNode);

  const isCollapsed = data?.isCollapsed || false;
  const title = data?.label || data?.title || 'Selected Group';

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      updateNodeInternals(id);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [id, isCollapsed, updateNodeInternals]);

  const nodeChrome = !isCollapsed ? (
    <NodeResizer
      isVisible={selected}
      minWidth={420}
      minHeight={260}
      lineStyle={{ borderColor: '#475569', borderWidth: 1 }}
      handleStyle={{
        width: 10,
        height: 10,
        borderRadius: 9999,
        background: '#475569',
        border: '1px solid #fff',
      }}
    />
  ) : null;
  const headerButtons = (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          ungroupNode(id);
        }}
        className={styles.anchorButton}
        title="Ungroup"
      >
        <Split size={14} />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleScenarioNode(id);
        }}
        className={styles.anchorButton}
        title={isCollapsed ? 'Expand' : 'Collapse'}
      >
        {isCollapsed ? <ExpandNodeIcon /> : <CollapseNodeIcon />}
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
      nodeChrome={nodeChrome}
      hideBody={isCollapsed}
      customClassName={`${styles.groupNodeWrapper} ${
        isCollapsed ? styles.groupNodeWrapperCollapsed : ''
      }`}
      style={isCollapsed ? { height: '50px', width: '250px' } : undefined}
    >
      <p className={styles.groupNodeDescription}>
        {t('This group contains selected nodes from the current scenario')}.
      </p>
    </NodeWrapper>
  );
}

export default GroupNode;
