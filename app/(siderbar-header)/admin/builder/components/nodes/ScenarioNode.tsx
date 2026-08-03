import { useLayoutEffect } from 'react';
import { Handle, Position, useUpdateNodeInternals } from 'reactflow';
import { useTranslation } from 'react-i18next';

import styles from './ChatNodes.module.css';
import { useBuilderStore } from '../../store/index';
import {
  CollapseNodeIcon,
  ExpandNodeIcon,
  StartNodeIcon,
} from '../icons/Icons';

function ScenarioNode({ id, data }: { id: string; data: any }) {
  const { t } = useTranslation();
  const startNodeId = useBuilderStore((state) => state.startNodeId);
  const setStartNodeId = useBuilderStore((state) => state.setStartNodeId);
  const nodeColor =
    useBuilderStore((state) => state.nodeColors.scenario) || '#7f8c8d';
  const textColor =
    useBuilderStore((state) => state.nodeTextColors.scenario) || '#ffffff';
  const toggleScenarioNode = useBuilderStore(
    (state) => state.toggleScenarioNode,
  );
  const deleteNode = useBuilderStore((state) => state.deleteNode);
  const updateNodeInternals = useUpdateNodeInternals();

  const isCollapsed = data.isCollapsed !== false;
  const isStartNode = startNodeId === id;

  const inputPos = data?.inputPosition === 'top' ? Position.Top : Position.Left;
  const outputPos =
    data?.outputPosition === 'bottom' ? Position.Bottom : Position.Right;

  useLayoutEffect(() => {
    updateNodeInternals(id);
  }, [id, inputPos, outputPos, updateNodeInternals]);

  return (
    <div
      className={`${styles.nodeWrapper} ${styles.scenarioNodeWrapper} ${isStartNode ? styles.startNode : ''}`}
      style={
        isCollapsed
          ? { height: '50px', width: '450px' }
          : { height: '120px', width: '450px' }
      }
    >
      <Handle
        type="target"
        position={inputPos}
        id={inputPos === Position.Top ? 'input-top' : 'input-left'}
        style={{
          ...(inputPos === Position.Top ? { top: -5 } : { left: -5 }),
          zIndex: 10,
          width: 10,
          height: 10,
          background: '#64748b',
          border: '2px solid #ffffff',
          cursor: 'crosshair',
        }}
      />
      <div
        className={styles.nodeHeader}
        style={{ backgroundColor: nodeColor, color: textColor }}
      >
        <span
          className={styles.headerTextContent}
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {t('Scenario')}: {data.label}
        </span>
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
          {/* Anchor button removed for scenario node */}
          <button
            onClick={() => toggleScenarioNode(id)}
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
            style={{ color: textColor, fontSize: '1rem', marginRight: '-5px' }}
          >
            &times;
          </button>
        </div>
      </div>
      {!isCollapsed && (
        <div
          className={styles.nodeBody}
          style={{
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            wordBreak: 'break-all',
          }}
        >
          <p
            className={styles.scenarioDescription}
            style={{ textAlign: 'left' }}
          >
            {`This group contains the '${data.label}' scenario.`}
          </p>
        </div>
      )}
      <Handle
        type="source"
        position={outputPos}
        id={outputPos === Position.Bottom ? 'output-bottom' : 'output-right'}
        style={{
          ...(outputPos === Position.Bottom ? { bottom: -5 } : { right: -5 }),
          zIndex: 10,
          width: 10,
          height: 10,
          background: '#64748b',
          border: '2px solid #ffffff',
          cursor: 'crosshair',
        }}
      />
    </div>
  );
}

export default ScenarioNode;
