import { Node, Edge } from '@xyflow/react';
import { useCallback } from 'react';
import * as d3 from 'd3-force';

/**
 * Find all disconnected components (subgraphs) using BFS.
 * Returns an array of arrays, where each inner array contains the node indices
 * belonging to one connected component.
 */
function findConnectedComponents(
  nodeCount: number,
  edges: { source: string; target: string }[],
  nodeIdToIndex: Map<string, number>,
): number[][] {
  const adjacency: Set<number>[] = Array.from(
    { length: nodeCount },
    () => new Set(),
  );

  for (const edge of edges) {
    const srcIdx = nodeIdToIndex.get(edge.source);
    const tgtIdx = nodeIdToIndex.get(edge.target);
    if (srcIdx !== undefined && tgtIdx !== undefined) {
      adjacency[srcIdx].add(tgtIdx);
      adjacency[tgtIdx].add(srcIdx);
    }
  }

  const visited = new Set<number>();
  const components: number[][] = [];

  for (let i = 0; i < nodeCount; i++) {
    if (visited.has(i)) continue;
    const component: number[] = [];
    const queue = [i];
    visited.add(i);
    while (queue.length > 0) {
      const current = queue.shift()!;
      component.push(current);
      for (const neighbor of adjacency[current]) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }
    components.push(component);
  }

  return components;
}

/**
 * Layout a single connected component using d3-force simulation.
 * Returns the positioned d3 nodes (with x, y set).
 */
function layoutComponent(
  componentNodes: any[],
  componentEdges: { source: string; target: string }[],
) {
  const d3Nodes = componentNodes.map((n) => ({
    ...n,
    x: 0,
    y: 0,
  }));

  const d3Edges = componentEdges.map((e) => ({
    source: e.source,
    target: e.target,
  }));

  const simulation = d3
    .forceSimulation(d3Nodes as d3.SimulationNodeDatum[])
    .force(
      'link',
      d3
        .forceLink(d3Edges)
        .id((d: any) => d.id)
        .distance(150)
        .iterations(3),
    )
    .force('charge', d3.forceManyBody().strength(-800)) // Strong repulsion for readable spacing
    .force('center', d3.forceCenter(0, 0))
    .force('x', d3.forceX().strength(0.05)) // Gentle pull to prevent excessive spread
    .force('y', d3.forceY().strength(0.05))
    .force('collide', d3.forceCollide().radius(65).iterations(3)); // Prevent overlapping

  simulation.stop();
  while (simulation.alpha() > simulation.alphaMin()) {
    simulation.tick();
  }

  return d3Nodes;
}

/**
 * Get the bounding box of a set of positioned d3 nodes.
 */
function getBoundingBox(d3Nodes: any[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const node of d3Nodes) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x);
    maxY = Math.max(maxY, node.y);
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

const COMPONENT_GAP = 100; // Gap between independent subgraphs (px)

export const useAutoLayout = () => {
  const onLayout = useCallback(
    (nodes: Node[], edges: Edge[], _direction = 'TB') => {
      if (nodes.length === 0) return { nodes, edges };

      // Build node ID -> index mapping
      const nodeIdToIndex = new Map<string, number>();
      nodes.forEach((n, i) => nodeIdToIndex.set(n.id, i));

      const edgeData = edges.map((e) => ({
        source: e.source,
        target: e.target,
      }));

      // 1. Find disconnected components
      const components = findConnectedComponents(
        nodes.length,
        edgeData,
        nodeIdToIndex,
      );

      // 2. Layout each component independently, then collect results
      const componentResults: {
        indices: number[];
        d3Nodes: any[];
        bbox: ReturnType<typeof getBoundingBox>;
      }[] = [];

      for (const componentIndices of components) {
        const componentNodeIds = new Set(
          componentIndices.map((i) => nodes[i].id),
        );

        // Nodes for this component
        const compNodes = componentIndices.map((i) => ({
          ...nodes[i],
          id: nodes[i].id,
        }));

        // Edges that belong entirely to this component
        const compEdges = edgeData.filter(
          (e) =>
            componentNodeIds.has(e.source) && componentNodeIds.has(e.target),
        );

        const d3Nodes = layoutComponent(compNodes, compEdges);
        const bbox = getBoundingBox(d3Nodes);

        componentResults.push({ indices: componentIndices, d3Nodes, bbox });
      }

      // 3. Arrange components side by side horizontally with a gap
      // Sort by number of nodes descending so the largest component comes first
      componentResults.sort((a, b) => b.indices.length - a.indices.length);

      let currentX = 0;
      const positionMap = new Map<number, { x: number; y: number }>();

      for (const { indices, d3Nodes, bbox } of componentResults) {
        // Offset: shift this component so its left edge starts at currentX
        const offsetX = currentX - bbox.minX;
        // Vertically center all components at y=0
        const offsetY = -bbox.minY;

        for (let j = 0; j < indices.length; j++) {
          const d3Node = d3Nodes[j] as any;
          positionMap.set(indices[j], {
            x: d3Node.x + offsetX,
            y: d3Node.y + offsetY,
          });
        }

        currentX += bbox.width + COMPONENT_GAP;
      }

      // 4. Map positions back to React Flow nodes
      const newNodes = nodes.map((node, i) => {
        const pos = positionMap.get(i)!;
        return {
          ...node,
          position: {
            // Offset by half of the node width/height (90/2 = 45) to center it correctly
            x: pos.x - 45,
            y: pos.y - 45,
          },
        };
      });

      return { nodes: newNodes, edges };
    },
    [],
  );

  return { onLayout };
};
