import { useMemo } from 'react';
import type { NodeTypeStyle, EdgeStyleConfig } from '@/lib/types/graphStyle';
import { useGraphStore } from './store/useGraphStore';

export const getNodePrefix = (rawType: string): string => {
  if (!rawType) return 'Default';
  return rawType.split('_')[0];
};

/**
 * Hook to provide graph style configuration.
 *
 * Reads from the Zustand store (populated once by GraphEditor on mount).
 * Returns the styling config (node types, edge styles, etc.) along with
 * a helper `getEdgeStyle()` function that formats edge styles for ReactFlow.
 *
 * Performance notes:
 * - Uses granular Zustand selectors to avoid unnecessary re-renders.
 * - `styleConfig` is set once on mount and never mutated, so the selector
 *   reference is stable after initialization.
 * - All derived values use `useMemo` for referential stability.
 */
export function useGraphStyles() {
  const config = useGraphStore((s) => s.styleConfig);
  const loading = useGraphStore((s) => s.styleLoading);

  // Derived values — only recalculated when config changes
  const nodeTypes: Record<string, string> = useMemo(
    () => config?.nodeTypes ?? {},
    [config],
  );

  const nodeTypeStyles: Record<string, NodeTypeStyle> = useMemo(
    () => config?.nodeTypeStyles ?? {},
    [config],
  );

  const edgeStyles: Record<string, EdgeStyleConfig> = useMemo(
    () => config?.edgeStyles ?? {},
    [config],
  );

  const mappingRules = useMemo(() => config?.mappingRules ?? [], [config]);

  const edgeColorDefault = config?.edgeColorDefault ?? '#cbd5e1';

  const nodeCategoryColors: Record<string, string> = useMemo(() => {
    if (!config) return {};
    return Object.fromEntries(
      config.nodeCategoryColors.map((c) => [c.category, c.color]),
    );
  }, [config]);

  /**
   * Format an edge style key into ReactFlow-compatible edge props.
   */
  const getEdgeStyle = useMemo(() => {
    return (type: string, sourceLevel?: string, targetLevel?: string) => {
      let matchedRule: any = null;

      if (sourceLevel && targetLevel) {
        // Priority 1: Exact match on full types (e.g. 'L1_Stream' -> 'L2_Module')
        matchedRule = mappingRules.find(
          (rule) =>
            rule.edgeType === type &&
            rule.startingPointType === sourceLevel &&
            rule.destinationType === targetLevel,
        );

        // Priority 2: Fallback match on prefix levels (e.g. 'L1' -> 'L2')
        if (!matchedRule) {
          const sourcePrefix = getNodePrefix(sourceLevel);
          const targetPrefix = getNodePrefix(targetLevel);
          matchedRule = mappingRules.find(
            (rule) =>
              rule.edgeType === type &&
              rule.startingPointType === sourcePrefix &&
              rule.destinationType === targetPrefix,
          );
        }
      }

      // Normalize fields if rule is matched; fallback to standard edgeStyles
      const cfg = matchedRule
        ? {
            label: matchedRule.edgeType || matchedRule.label,
            color: matchedRule.edgeColor || matchedRule.color,
            strokeWidth: matchedRule.strokeWidth || 1.5,
            strokeType: matchedRule.strokeType,
            pathType: matchedRule.pathType,
            sourceMark: matchedRule.sourceMark,
            targetMark: matchedRule.targetMark,
          }
        : edgeStyles[type];

      const cleanColor = (colorStr: string) => {
        return colorStr.replace('#', '');
      };

      const getMarkerId = (mark: string, color: string) => {
        if (!mark || mark === 'NONE') return undefined;
        return `marker-${mark.toLowerCase()}-${cleanColor(color)}`;
      };

      if (!cfg) {
        const color = edgeColorDefault;
        return {
          style: { stroke: color, strokeWidth: 2 },
          markerEnd: `marker-arrow-${cleanColor(color)}`,
          label: type,
          data: { pathType: 'bezier' },
        };
      }

      const strokeDasharray = cfg.strokeType === 'DASHED' ? '6, 4' : undefined;
      const pathType = cfg.pathType === 'CORNER' ? 'step' : 'bezier';
      const color = cfg.color || '#111111';

      return {
        style: {
          stroke: color,
          strokeWidth: cfg.strokeWidth || 1.5,
          strokeDasharray,
        },
        markerStart: getMarkerId(cfg.sourceMark, color),
        markerEnd: getMarkerId(cfg.targetMark, color),
        label: cfg.label || type,
        data: {
          pathType,
        },
      };
    };
  }, [edgeStyles, mappingRules, edgeColorDefault]);

  return {
    loading,
    nodeTypes,
    nodeTypeStyles,
    edgeStyles,
    edgeColorDefault,
    nodeCategoryColors,
    getEdgeStyle,
  };
}
