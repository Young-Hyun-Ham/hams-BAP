/**
 * Types for graph visual styling configuration.
 * These types define the shape of data returned by the graphStyleService.
 * When the API is ready, the mock data will be replaced with real API calls
 * but the types will remain the same.
 */

export type StrokeType = 'SOLID' | 'DASHED';
export type PathType = 'CURVE' | 'CORNER';
export type MarkType = 'ARROW' | 'CIRCLE' | 'SQUARE' | 'RHOMBUS' | 'NONE';

export interface NodeTypeStyle {
  bg: string;
  color?: string;
  border?: string;
  fontSize?: string | number;
  lineHeight?: string | number;
}

export interface EdgeStyleConfig {
  label: string;
  color: string;
  strokeWidth: number;
  strokeType: StrokeType;
  pathType: PathType;
  sourceMark: MarkType;
  targetMark: MarkType;
}

export interface MappingRule {
  startingPointType: string;
  destinationType: string;
  label: string;
  color: string;
  strokeType: StrokeType;
  pathType: PathType;
  sourceMark: MarkType;
  targetMark: MarkType;
  // For backward/API compatibility
  edgeType?: string;
  edgeColor?: string;
}

export interface NodeCategoryColor {
  category: string;
  color: string;
}

export interface GraphStyleConfig {
  nodeTypes?: Record<string, string>;
  nodeTypeStyles: Record<string, NodeTypeStyle>;
  edgeStyles: Record<string, EdgeStyleConfig>;
  nodeCategoryColors: NodeCategoryColor[];
  edgeColorDefault: string;
  mappingRules: MappingRule[];
}
