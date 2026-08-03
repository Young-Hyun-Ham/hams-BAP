/**
 * Chunk and document mock data for the right sidebar "Source Documents" tab.
 * TODO: Replace with real API calls when backend is ready.
 */

export const STREAM_CLASS: Record<string, string> = {
  'CUSTOMER SERVICE': 'cs',
  COMMERCIAL: 'com',
  LOGISTICS: 'log',
  VESSEL: 'ves',
  FINANCE: 'fin',
  OPERATION: 'ops',
  EQUIPMENT: 'fin',
};

export type ChunkDoc = {
  docId: string;
  docTitle: string;
  stream: string;
  chunkIds: string[];
};

export type Chunk = {
  id: string;
  docId: string;
  page: string;
  loc: string;
  text: string;
  bboxes?: {
    page: number;
    left: number;
    top: number;
    width: number;
    height: number;
  }[];
};

export type NodeChunks = {
  docs: ChunkDoc[];
  chunks: Chunk[];
};
