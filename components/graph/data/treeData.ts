/**
 * Tree data types and mock data for the left sidebar navigator.
 * TODO: Replace fetchTreeData with a real API call when backend is ready.
 */

import type { VisualizationDataRes } from '@/lib/types/graph';

export interface TreeItem {
  id: string;
  label: string;
  code?: string;
  depth: number;
  checked: boolean;
  expanded?: boolean;
  children: TreeItem[];
}

const TREE_DATA_RAW: any[] = [];

function normalizeTree(items: any[]): TreeItem[] {
  return (items || []).map((item) => {
    const children = normalizeTree(item.children || []);
    return { ...item, children };
  });
}

/**
 * Build a hierarchical tree of TreeItem[] from flat graph nodes and edges.
 * Uses relationships with the label "INCLUDE" as parent-child links.
 */
export function buildTreeFromVisualizationData(
  data: VisualizationDataRes,
  oldTreeData?: TreeItem[],
): TreeItem[] {
  if (!data || !data.nodes || !data.edges) {
    return normalizeTree(TREE_DATA_RAW);
  }

  const includeEdges = data.edges.filter(
    (e) => e.label && e.label.toUpperCase() === 'INCLUDE',
  );

  const parentToChildren: Record<string, string[]> = {};
  const childToParent: Record<string, string> = {};

  includeEdges.forEach((e) => {
    const parent = e.source;
    const child = e.target;
    if (!parentToChildren[parent]) {
      parentToChildren[parent] = [];
    }
    parentToChildren[parent].push(child);
    childToParent[child] = parent;
  });

  const nodesMap = new Map<string, (typeof data.nodes)[0]>();
  data.nodes.forEach((n) => {
    nodesMap.set(n.id, n);
  });

  const visited = new Set<string>();

  let oldAll = new Set<string>();
  let oldChecked = new Set<string>();
  let oldExpanded = new Set<string>();

  if (oldTreeData && oldTreeData.length > 0) {
    const state = getTreeNodesState(oldTreeData);
    oldAll = state.allTreeNodeIds;
    oldChecked = state.checkedNodeIds;
    oldExpanded = state.expandedNodeIds;
  }

  const buildSubtree = (nodeId: string, depth: number): TreeItem | null => {
    if (visited.has(nodeId)) return null;
    visited.add(nodeId);

    const node = nodesMap.get(nodeId);
    if (!node) return null;

    const childrenIds = parentToChildren[nodeId] || [];
    const children: TreeItem[] = [];
    for (const childId of childrenIds) {
      const childTreeItem = buildSubtree(childId, depth + 1);
      if (childTreeItem) {
        children.push(childTreeItem);
      }
    }

    const isNew = !oldAll.has(node.id);
    const checked = isNew ? true : oldChecked.has(node.id);
    const expanded = oldAll.has(node.id) ? oldExpanded.has(node.id) : undefined;

    return {
      id: node.id,
      label: node.properties?.name || node.label,
      code: node.properties?.code || node.properties?.id || undefined,
      depth,
      checked,
      ...(expanded !== undefined && { expanded }),
      children,
    };
  };

  const roots = data.nodes.filter((n) => {
    const hasParent = !!childToParent[n.id];
    const isTopLevelType = n.label === 'L1';
    const hasChildren =
      parentToChildren[n.id] && parentToChildren[n.id].length > 0;
    return !hasParent && (isTopLevelType || hasChildren);
  });

  const tree: TreeItem[] = [];
  roots.forEach((root) => {
    const rootItem = buildSubtree(root.id, 0);
    if (rootItem) {
      tree.push(rootItem);
    }
  });

  return tree.length > 0 ? tree : normalizeTree(TREE_DATA_RAW);
}

/**
 * Fetch tree data. Currently returns mock data.
 * TODO: Replace with real API call:
 *   return apiClient.get<TreeItem[]>(`${API_PREFIX}/tree`);
 */
export const fetchTreeData = async (): Promise<TreeItem[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(normalizeTree(TREE_DATA_RAW));
    }, 500);
  });
};

// ── Tree state helpers ──────────────────────────────────────────

export function toggleExpand(data: TreeItem[], id: string): TreeItem[] {
  return data.map((item: TreeItem) => {
    if (item.id === id)
      return { ...item, expanded: item.expanded === false ? true : false };
    return { ...item, children: toggleExpand(item.children, id) };
  });
}

function setCheckedAll(items: TreeItem[], checked: boolean): TreeItem[] {
  return items.map((child) => ({
    ...child,
    checked,
    children: setCheckedAll(child.children, checked),
  }));
}

export function toggleCheck(
  data: TreeItem[],
  id: string,
  checked: boolean,
): TreeItem[] {
  return data.map((item: TreeItem) => {
    if (item.id === id) {
      return {
        ...item,
        checked,
        children: setCheckedAll(item.children, checked),
      };
    }
    return { ...item, children: toggleCheck(item.children, id, checked) };
  });
}

export function expandAll(data: TreeItem[]): TreeItem[] {
  return data.map((top: TreeItem) => ({
    ...top,
    expanded: true,
    children:
      top.children?.map((l1) => ({
        ...l1,
        expanded: true,
        children:
          l1.children?.map((l2) => ({
            ...l2,
            expanded: true,
            children:
              l2.children?.map((l3) => ({ ...l3, expanded: true })) || [],
          })) || [],
      })) || [],
  }));
}

/**
 * Traverse the tree to collect all tree node IDs and all currently checked node IDs.
 */
export function getTreeNodesState(items: TreeItem[]): {
  allTreeNodeIds: Set<string>;
  checkedNodeIds: Set<string>;
  expandedNodeIds: Set<string>;
} {
  const allTreeNodeIds = new Set<string>();
  const checkedNodeIds = new Set<string>();
  const expandedNodeIds = new Set<string>();

  const traverse = (nodes: TreeItem[]) => {
    (nodes || []).forEach((node) => {
      allTreeNodeIds.add(node.id);
      if (node.checked) {
        checkedNodeIds.add(node.id);
      }
      if (node.expanded) {
        expandedNodeIds.add(node.id);
      }
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    });
  };

  traverse(items);
  return { allTreeNodeIds, checkedNodeIds, expandedNodeIds };
}
