import { Handle, Position, type NodeProps } from 'reactflow';
import { useTranslation } from 'react-i18next';

import styles from './ChatNodes.module.css';
import { useBuilderStore } from '../../../store';
import NodeWrapper from './NodeWrapper';

type BranchCondition = {
  id?: string;
  slot?: string;
  operator?: string;
  valueType?: string;
  value?: string;
};

type BranchReply = {
  display?: string;
  value?: string;
};

type BranchNodeData = {
  content?: string;
  evaluationType?: string;
  conditions?: BranchCondition[];
  replies?: BranchReply[];
  flowCollapsed?: boolean;
  flowBranchHeight?: number;
  flowBranchCaseTops?: number[];
  flowBranchCaseHeights?: number[];
  flowBranchCaseLefts?: number[];
  flowBranchCaseWidths?: number[];
  flowBranchSummaryHeight?: number;
  flowBranchWidth?: number;
};

type BranchLane = {
  id: string;
  label: string;
  subtitle: string;
  handleId?: string;
  isDefault?: boolean;
};

const getConditionLabel = (condition: BranchCondition) => {
  const slot = condition.slot ? `{${condition.slot}}` : '{slot}';
  const operator = condition.operator || '=';
  const value =
    condition.valueType === 'slot'
      ? `{${condition.value || 'slot'}}`
      : `'${condition.value || ''}'`;

  return `${slot} ${operator} ${value}`;
};

function BranchNode({ id, data }: NodeProps<BranchNodeData>) {
  const { t } = useTranslation();
  const nodeColor = useBuilderStore((state) => state.nodeColors.branch);
  const textColor = useBuilderStore((state) => state.nodeTextColors.branch);

  const conditions = Array.isArray(data.conditions) ? data.conditions : [];
  const replies = Array.isArray(data.replies) ? data.replies : [];
  const isConditionType = data.evaluationType === 'CONDITION';
  const branchLanes: BranchLane[] = isConditionType
    ? [
        ...conditions.map((condition, index) => ({
          id: condition.id || replies[index]?.value || `condition-${index}`,
          label: getConditionLabel(condition),
          subtitle: `${t('Condition')} ${index + 1}`,
          handleId:
            replies[index]?.value || condition.id || `condition-${index}`,
        })),
        {
          id: 'default',
          label: t('Default'),
          subtitle: t('Fallback'),
          isDefault: true,
        },
      ]
    : replies.length > 0
      ? replies.map((reply, index) => ({
          id: reply.value || `reply-${index}`,
          label: reply.display || reply.value || `${t('Button')} ${index + 1}`,
          subtitle: `${t('Button')} ${index + 1}`,
          handleId: reply.value || `reply-${index}`,
        }))
      : [
          {
            id: 'default',
            label: t('Default'),
            subtitle: t('Fallback'),
            isDefault: true,
          },
        ];

  const branchWidth = data.flowBranchWidth || 260;
  const branchHeight = data.flowBranchHeight || 220;
  const branchSummaryHeight = data.flowCollapsed
    ? 0
    : data.flowBranchSummaryHeight || 82;
  const caseTops = Array.isArray(data.flowBranchCaseTops)
    ? data.flowBranchCaseTops
    : [];
  const caseHeights = Array.isArray(data.flowBranchCaseHeights)
    ? data.flowBranchCaseHeights
    : [];
  const caseLefts = Array.isArray(data.flowBranchCaseLefts)
    ? data.flowBranchCaseLefts
    : [];
  const caseWidths = Array.isArray(data.flowBranchCaseWidths)
    ? data.flowBranchCaseWidths
    : [];
  const customHandles = (
    <>
      {branchLanes.map((lane, index) => (
        <Handle
          key={lane.id}
          type="source"
          position={Position.Bottom}
          id={lane.handleId}
          style={{
            bottom: 'auto',
            left: `${(caseLefts[index] || 0) + (caseWidths[index] || 0) / 2}px`,
            top: `${(caseTops[index] || 148) - 27}px`,
            background: lane.isDefault ? '#ef4444' : '#475569',
            opacity: 0,
          }}
        />
      ))}
    </>
  );

  return (
    <NodeWrapper
      id={id}
      typeLabel={t('Condition Branch')}
      icon={null}
      nodeColor={nodeColor}
      textColor={textColor}
      handles={customHandles}
      customClassName={`${styles.branchGroupNodeWrapper} ${
        data.flowCollapsed ? styles.branchGroupNodeCollapsed : ''
      }`}
      style={{
        width: branchWidth,
        minHeight: branchHeight,
      }}
      collapseContentOnHeader={false}
    >
      <div className={styles.branchGroupBody}>
        {!data.flowCollapsed && (
          <div className={styles.branchGroupSummary}>
            <div
              className={styles.branchGroupMeta}
              style={{ minHeight: branchSummaryHeight }}
            >
              <span className={styles.branchGroupLabel}>
                {t('Evaluation Type')}
              </span>
              <span className={styles.branchGroupBadge}>
                {isConditionType ? t('Conditions') : t('Buttons')}
              </span>
              <div className={styles.branchGroupText}>
                {data.content || `${t('No branch text added')}.`}
              </div>
            </div>
          </div>
        )}

        <div className={styles.branchCaseList}>
          {branchLanes.map((lane, index) => (
            <div
              key={lane.id}
              className={`${styles.branchCasePanel} ${
                lane.isDefault ? styles.branchCaseDefault : ''
              }`}
              style={{
                left: caseLefts[index] || 0,
                top: caseTops[index] || 148,
                width: caseWidths[index] || 180,
                minHeight: caseHeights[index] || 94,
              }}
            >
              <div
                className={`${styles.branchCaseVertex} ${
                  lane.isDefault ? styles.branchCaseVertexDefault : ''
                }`}
              />
              <div className={styles.branchCaseHeader}>
                <span className={styles.branchCaseLabel}>{lane.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </NodeWrapper>
  );
}

export default BranchNode;
