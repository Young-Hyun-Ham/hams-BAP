import {
  Clipboard,
  Copy,
  PackageX,
  Scissors,
  StickyNote,
  Trash,
} from 'lucide-react';
import { RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import styles from '../FlowCanvas.module.css';

import type { ContextMenuState } from '../../types';

type FlowContextMenuProps = {
  contextMenu: ContextMenuState;
  hasClipboard: boolean;
  flowWrapperRef: RefObject<HTMLDivElement | null>;
  onPaste: (position?: { x: number; y: number } | null) => void;
  onAddMemo?: (reactFlowWrapper: RefObject<HTMLDivElement | null>) => void;
  onClose: () => void;
  onCopyNode: (nodeId: string) => void;
  onCutNode: (nodeId: string) => void;
  onDeleteNode: (nodeId: string) => void;
  onSetContextMenu: (state: ContextMenuState) => void;
};

export default function FlowContextMenu({
  contextMenu,
  hasClipboard,
  flowWrapperRef,
  onPaste,
  onAddMemo,
  onClose,
  onCopyNode,
  onCutNode,
  onDeleteNode,
  onSetContextMenu,
}: FlowContextMenuProps) {
  const { t } = useTranslation();

  if (!contextMenu.open) return null;

  if (contextMenu.target?.type === 'pane') {
    return (
      <div
        className={styles.layerMenu}
        style={{ left: contextMenu.x, top: contextMenu.y }}
      >
        <button
          type="button"
          className={`${styles.layerMenuItem} ${
            !hasClipboard ? styles.layerMenuItemDisabled : ''
          }`}
          onClick={() => onPaste(contextMenu.flowPosition ?? null)}
          disabled={!hasClipboard}
        >
          <Clipboard size={16} className={styles.layerMenuIcon} />
          <span>{t('Paste')}</span>
        </button>

        <div className={styles.layerMenuDivider} />

        <button
          type="button"
          className={styles.layerMenuItem}
          onClick={() => {
            onSetContextMenu({ open: false, x: 0, y: 0, target: 'pane' });
            onAddMemo?.(flowWrapperRef);
          }}
        >
          <StickyNote size={16} className={styles.layerMenuIcon} />
          <span>{t('Add Memo')}</span>
        </button>

        <div className={styles.layerMenuDivider} />

        <button
          type="button"
          className={styles.layerMenuItem}
          onClick={onClose}
        >
          <PackageX size={16} className={styles.layerMenuIcon} />
          <span>{t('Close')}</span>
        </button>
      </div>
    );
  }

  if (contextMenu.target?.type !== 'node') return null;

  return (
    <div
      className={styles.layerMenu}
      style={{ left: contextMenu.x, top: contextMenu.y }}
    >
      <button
        type="button"
        className={styles.layerMenuItem}
        onClick={() => onCopyNode(contextMenu.target.id)}
      >
        <Copy size={16} className={styles.layerMenuIcon} />
        <span>{t('Copy Node')}</span>
      </button>

      <button
        type="button"
        className={styles.layerMenuItem}
        onClick={() => onCutNode(contextMenu.target.id)}
      >
        <Scissors size={16} className={styles.layerMenuIcon} />
        <span>{t('Cut Node')}</span>
      </button>

      <button
        type="button"
        className={`${styles.layerMenuItem} ${
          !hasClipboard ? styles.layerMenuItemDisabled : ''
        }`}
        onClick={() => onPaste(contextMenu.flowPosition ?? null)}
        disabled={!hasClipboard}
      >
        <Clipboard size={16} className={styles.layerMenuIcon} />
        <span>{t('Paste')}</span>
      </button>

      <div className={styles.layerMenuDivider} />

      <button
        type="button"
        className={styles.layerMenuItem}
        onClick={() => onDeleteNode(contextMenu.target.id)}
      >
        <Trash size={16} className={styles.layerMenuIcon} />
        <span>{t('Delete Node')}</span>
      </button>
    </div>
  );
}
