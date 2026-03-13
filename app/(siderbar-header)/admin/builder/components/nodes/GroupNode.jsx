import { Handle, Position } from 'reactflow';
import { NodeResizer } from '@reactflow/node-resizer';
import styles from './ChatNodes.module.css';
import useBuilderStore from '../../store/index';
import { CollapseNodeIcon, ExpandNodeIcon, StartNodeIcon, AnchorIcon } from '../icons/Icons';
import { Split } from 'lucide-react';

function GroupNode({ id, data, selected }) {
  const startNodeId = useBuilderStore((state) => state.startNodeId);
  const anchorNodeId = useBuilderStore((state) => state.anchorNodeId);
  const setStartNodeId = useBuilderStore((state) => state.setStartNodeId);
  const setAnchorNodeId = useBuilderStore((state) => state.setAnchorNodeId);
  const toggleScenarioNode = useBuilderStore((state) => state.toggleScenarioNode);
  const deleteNode = useBuilderStore((state) => state.deleteNode);
  const ungroupNode = useBuilderStore((state) => state.ungroupNode);

  const isCollapsed = data?.isCollapsed || false;
  const isStartNode = startNodeId === id;
  const isAnchored = anchorNodeId === id;
  const title = data?.label || data?.title || 'Selected Group';

  return (
    <div
      className={`
        ${styles.nodeWrapper}
        ${styles.groupNodeWrapper}
        ${isCollapsed ? styles.groupNodeWrapperCollapsed : ''}
        ${isStartNode ? styles.startNode : ''}
        ${isAnchored ? styles.anchored : ''}
      `}
      style={isCollapsed ? { height: '50px', width: '250px' } : undefined}
    >
      {!isCollapsed && (
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
      )}

      <Handle type="target" position={Position.Left} />

      <div
        className={styles.nodeHeader}
        style={{ backgroundColor: '#475569', color: '#ffffff' }}
      >
        <span className={styles.headerTextContent}>Group: {title}</span>

        <div className={styles.headerButtons}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setStartNodeId(id);
            }}
            className={`${styles.startNodeButton} ${isStartNode ? styles.active : ''}`}
            title="Set as Start Node"
          >
            <StartNodeIcon />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setAnchorNodeId(id); }}
            className={`${styles.anchorButton} ${isAnchored ? styles.active : ''}`}
            title="Set as anchor"
          >
            <AnchorIcon />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              ungroupNode(id);
            }}
            className={styles.anchorButton}
            title="Ungroup"
          >
            <Split size={18} />
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

          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteNode(id);
            }}
            className={styles.deleteButton}
            style={{ color: '#ffffff', fontSize: '1rem', marginRight: '-5px' }}
            title="Delete Group"
          >
            &times;
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className={styles.nodeBody}>
          <p className={styles.groupNodeDescription}>
            This group contains selected nodes from the current scenario.
          </p>
        </div>
      )}

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export default GroupNode;
