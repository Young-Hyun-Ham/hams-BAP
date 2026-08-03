import { Box, Typography } from '@mui/material';
import { CirclePlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Handle, Position, type EdgeProps, type NodeProps } from 'reactflow';

import ApiNode from './nodes/ApiNode';
import BranchNode from './nodes/BranchNode';
import FormNode from './nodes/FormNode';
import GroupNode from './nodes/GroupNode';
import IframeNode from './nodes/IframeNode';
import LinkNode from './nodes/LinkNode';
import MessageNode from './nodes/MessageNode';
import ScenarioNode from './nodes/ScenarioNode';
import SetSlotNode from './nodes/SetSlotNode';

import type { AddNodeData } from '../types';

function StartNode() {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        width: 54,
        height: 54,
        borderRadius: '50%',
        border: '3px solid #72adc2',
        bgcolor: '#fff',
        boxShadow: '0 5px 14px rgba(40, 88, 110, 0.16)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#426b7b' }}>
        {t('Start')}
      </Typography>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </Box>
  );
}

function EndNode() {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        width: 54,
        height: 54,
        borderRadius: '50%',
        border: '3px solid #a7b6c2',
        bgcolor: '#fff',
        boxShadow: '0 5px 14px rgba(15, 23, 42, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Typography sx={{ fontSize: 10, fontWeight: 700, color: '#64748b' }}>
        {t('End')}
      </Typography>
    </Box>
  );
}

function AddFlowNode({ data }: NodeProps<AddNodeData>) {
  return (
    <Box
      component="button"
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        data.onAdd(data.target);
      }}
      sx={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        border: `1px solid #c9d4de`,
        bgcolor: '#fff',
        color: '#93a3af',
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer',
        p: 0,
        boxShadow: '0 1px 5px rgba(15, 23, 42, 0.12)',
        '&:hover': {
          borderColor: '#0f6cbd',
          color: '#0f6cbd',
          bgcolor: '#f5fbff',
        },
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{ opacity: 0, top: -2 }}
      />
      <CirclePlus size={12} />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ opacity: 0, bottom: -2 }}
      />
    </Box>
  );
}

function EndMergeEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
}: EdgeProps) {
  const joinY = targetY - 26;
  const distanceY = Math.max(1, Math.abs(joinY - sourceY));
  const distanceX = Math.abs(targetX - sourceX);
  const isCenterLane = distanceX < 36;
  const curveHeight = Math.min(96, Math.max(42, distanceY * 0.28));
  const curveStartY = Math.max(sourceY, joinY - curveHeight);
  const edgePath = isCenterLane
    ? `M ${sourceX},${sourceY} L ${targetX},${joinY} L ${targetX},${targetY}`
    : `M ${sourceX},${sourceY} L ${sourceX},${curveStartY} C ${sourceX},${joinY} ${targetX},${joinY} ${targetX},${joinY} L ${targetX},${targetY}`;

  return (
    <path
      id={id}
      d={edgePath}
      className="react-flow__edge-path"
      style={{
        stroke: '#8f9daa',
        strokeWidth: 1.35,
        fill: 'none',
        ...style,
      }}
    />
  );
}

function FanoutCurveEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  style,
}: EdgeProps) {
  const fanoutDropY = 15;
  const curveStartY = sourceY + fanoutDropY;
  const curveDistanceY = Math.max(1, targetY - curveStartY);
  const curveDistanceX = targetX - sourceX;
  const controlX1 = sourceX + curveDistanceX * 0.72;
  const controlY2 = targetY - Math.max(28, curveDistanceY * 0.28);
  const edgePath = `M ${sourceX},${sourceY} L ${sourceX},${curveStartY} C ${controlX1},${curveStartY} ${targetX},${controlY2} ${targetX},${targetY}`;

  return (
    <path
      id={id}
      d={edgePath}
      className="react-flow__edge-path"
      markerEnd={markerEnd}
      style={{
        stroke: '#8f9daa',
        strokeWidth: 1.35,
        fill: 'none',
        ...style,
      }}
    />
  );
}

function BranchFanoutCurveEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  markerEnd,
  style,
}: EdgeProps) {
  const dropY = 15;
  const curveStartY = sourceY + dropY;
  const curveDistanceY = Math.max(1, targetY - curveStartY);
  const curveDistanceX = targetX - sourceX;
  const controlX1 = sourceX + curveDistanceX * 0.72;
  const controlY2 = targetY - Math.max(28, curveDistanceY * 0.28);
  const edgePath = `M ${sourceX},${sourceY} L ${sourceX},${curveStartY} C ${controlX1},${curveStartY} ${targetX},${controlY2} ${targetX},${targetY}`;

  return (
    <path
      id={id}
      d={edgePath}
      className="react-flow__edge-path"
      markerEnd={markerEnd}
      style={{
        stroke: '#8f9daa',
        strokeWidth: 1.35,
        fill: 'none',
        ...style,
      }}
    />
  );
}

export const flowNodeTypes = {
  message: MessageNode,
  branch: BranchNode,
  api: ApiNode,
  form: FormNode,
  link: LinkNode,
  iframe: IframeNode,
  scenario: ScenarioNode,
  setSlot: SetSlotNode,
  selectionGroup: GroupNode,
  start: StartNode,
  end: EndNode,
  add: AddFlowNode,
};

export const flowEdgeTypes = {
  endMerge: EndMergeEdge,
  fanoutCurve: FanoutCurveEdge,
  branchFanoutCurve: BranchFanoutCurveEdge,
};
