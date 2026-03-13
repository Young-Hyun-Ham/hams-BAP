import { BaseEdge, EdgeLabelRenderer } from 'reactflow';
import useBuilderStore from '../../store/index';

const MIN_SEGMENT_LENGTH = 24;

function clonePoint(point) {
  return { x: point.x, y: point.y };
}

function samePoint(a, b) {
  return a.x === b.x && a.y === b.y;
}

function dedupe(points) {
  const result = [];
  for (const point of points) {
    const prev = result[result.length - 1];
    if (!prev || !samePoint(prev, point)) {
      result.push(clonePoint(point));
    }
  }
  return result;
}

function compressCollinear(points) {
  if (points.length <= 2) return points.map(clonePoint);

  const result = [clonePoint(points[0])];

  for (let i = 1; i < points.length - 1; i += 1) {
    const prev = result[result.length - 1];
    const curr = points[i];
    const next = points[i + 1];

    const sameVertical = prev.x === curr.x && curr.x === next.x;
    const sameHorizontal = prev.y === curr.y && curr.y === next.y;

    if (sameVertical || sameHorizontal) continue;
    result.push(clonePoint(curr));
  }

  result.push(clonePoint(points[points.length - 1]));
  return result;
}

function expandDiagonalPairs(points) {
  if (!Array.isArray(points) || points.length < 2) {
    return points ?? [];
  }

  const result = [clonePoint(points[0])];

  for (let i = 1; i < points.length; i += 1) {
    const prev = result[result.length - 1];
    const curr = clonePoint(points[i]);

    if (prev.x === curr.x || prev.y === curr.y) {
      result.push(curr);
      continue;
    }

    // 현재 잘 움직이는 구조를 유지하기 위해 "가로 먼저"로만 보정
    result.push({ x: curr.x, y: prev.y });
    result.push(curr);
  }

  return result;
}

function normalize(points) {
  return compressCollinear(dedupe(expandDiagonalPairs(points)));
}

function getInitialBendPoints(sourceX, sourceY, targetX, targetY) {
  if (sourceY === targetY || sourceX === targetX) {
    return [];
  }

  return [{ x: targetX, y: sourceY }];
}

function getBendPoints(sourceX, sourceY, targetX, targetY, storedPoints) {
  if (Array.isArray(storedPoints)) {
    return normalize(storedPoints);
  }

  return getInitialBendPoints(sourceX, sourceY, targetX, targetY);
}

function buildFullPoints(sourceX, sourceY, targetX, targetY, bendPoints) {
  return normalize([
    { x: sourceX, y: sourceY },
    ...bendPoints.map(clonePoint),
    { x: targetX, y: targetY },
  ]);
}

function buildPath(points) {
  return points
    .map((point, index) =>
      index === 0 ? `M ${point.x},${point.y}` : `L ${point.x},${point.y}`
    )
    .join(' ');
}

function getSegments(points) {
  const segments = [];

  for (let i = 0; i < points.length - 1; i += 1) {
    const start = points[i];
    const end = points[i + 1];

    const isHorizontal = start.y === end.y;
    const isVertical = start.x === end.x;
    if (!isHorizontal && !isVertical) continue;

    const length = isHorizontal
      ? Math.abs(end.x - start.x)
      : Math.abs(end.y - start.y);

    if (length < MIN_SEGMENT_LENGTH) continue;

    segments.push({
      index: i,
      isHorizontal,
      isVertical,
      centerX: (start.x + end.x) / 2,
      centerY: (start.y + end.y) / 2,
    });
  }

  return segments;
}

function moveSegment(fullPoints, segmentIndex, dx, dy) {
  const points = fullPoints.map(clonePoint);
  const lastSegmentIndex = points.length - 2;

  const start = points[segmentIndex];
  const end = points[segmentIndex + 1];
  if (!start || !end) return points;

  const isHorizontal = start.y === end.y;
  const isVertical = start.x === end.x;

  // 1) straight line
  if (points.length === 2) {
    if (isHorizontal) {
      const newY = start.y + dy;
      return normalize([
        points[0],
        { x: points[0].x, y: newY },
        { x: points[1].x, y: newY },
        points[1],
      ]);
    }

    if (isVertical) {
      const newX = start.x + dx;
      return normalize([
        points[0],
        { x: newX, y: points[0].y },
        { x: newX, y: points[1].y },
        points[1],
      ]);
    }

    return points;
  }

  // 2) first segment
  if (segmentIndex === 0) {
    if (isHorizontal) {
      const newY = start.y + dy;
      const inserted = { x: points[0].x, y: newY };
      const movedCorner = { ...points[1], y: newY };
      return normalize([points[0], inserted, movedCorner, ...points.slice(2)]);
    }

    if (isVertical) {
      const newX = start.x + dx;
      const inserted = { x: newX, y: points[0].y };
      const movedCorner = { ...points[1], x: newX };
      return normalize([points[0], inserted, movedCorner, ...points.slice(2)]);
    }
  }

  // 3) last segment
  if (segmentIndex === lastSegmentIndex) {
    if (isHorizontal) {
      const newY = start.y + dy;
      const movedCorner = { ...points[lastSegmentIndex], y: newY };
      const inserted = { x: points[points.length - 1].x, y: newY };
      return normalize([
        ...points.slice(0, lastSegmentIndex),
        movedCorner,
        inserted,
        points[points.length - 1],
      ]);
    }

    if (isVertical) {
      const newX = start.x + dx;
      const movedCorner = { ...points[lastSegmentIndex], x: newX };
      const inserted = { x: newX, y: points[points.length - 1].y };
      return normalize([
        ...points.slice(0, lastSegmentIndex),
        movedCorner,
        inserted,
        points[points.length - 1],
      ]);
    }
  }

  // 4) middle segment
  if (isHorizontal) {
    points[segmentIndex].y += dy;
    points[segmentIndex + 1].y += dy;
  }

  if (isVertical) {
    points[segmentIndex].x += dx;
    points[segmentIndex + 1].x += dx;
  }

  return normalize(points);
}

function CustomOrthogonalEdge(props) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    markerEnd,
    selected,
    data,
    style,
  } = props;

  const updateEdgePoints = useBuilderStore((state) => state.updateEdgePoints);

  const bendPoints = getBendPoints(
    sourceX,
    sourceY,
    targetX,
    targetY,
    data?.points
  );

  const fullPoints = buildFullPoints(
    sourceX,
    sourceY,
    targetX,
    targetY,
    bendPoints
  );

  const edgePath = buildPath(fullPoints);
  const segments = getSegments(fullPoints);

  const createMouseDownHandler = (segment) => (event) => {
    event.preventDefault();
    event.stopPropagation();

    const startClientX = event.clientX;
    const startClientY = event.clientY;
    const initialFullPoints = fullPoints.map(clonePoint);

    const onMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startClientX;
      const dy = moveEvent.clientY - startClientY;

      const movedFullPoints = moveSegment(
        initialFullPoints,
        segment.index,
        segment.isVertical ? dx : 0,
        segment.isHorizontal ? dy : 0
      );

      updateEdgePoints(id, normalize(movedFullPoints).slice(1, -1));
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />

      {selected && (
        <EdgeLabelRenderer>
          <>
            {segments.map((segment) => (
              <div
                key={`${id}-segment-${segment.index}`}
                onMouseDown={createMouseDownHandler(segment)}
                title={segment.isHorizontal ? 'Move vertical' : 'Move horizontal'}
                style={{
                  position: 'absolute',
                  transform: `translate(-50%, -50%) translate(${segment.centerX}px, ${segment.centerY}px)`,
                  width: 14,
                  height: 14,
                  borderRadius: 9999,
                  background: '#2563eb',
                  border: '2px solid #ffffff',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                  cursor: segment.isHorizontal ? 'ns-resize' : 'ew-resize',
                  pointerEvents: 'all',
                  zIndex: 30,
                }}
              />
            ))}
          </>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default CustomOrthogonalEdge;
