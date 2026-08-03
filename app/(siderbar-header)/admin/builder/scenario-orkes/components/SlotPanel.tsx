import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useBuilderStore } from '../../store/index';
import styles from './SlotPanel.module.css';

function SlotPanel() {
  const { t } = useTranslation();
  const slots = useBuilderStore((state: unknown) => (state as any).slots);
  const selectedRow = useBuilderStore(
    (state: unknown) => (state as any).selectedRow,
  );
  const hasSlots = Object.keys(slots || {}).length > 0;
  const hasSelectedRow = selectedRow !== null && selectedRow !== undefined;

  // 💡 any 타입을 줄이고, value의 타입을 더 명확히 지정하는 것이 좋습니다.
  const renderValue = (value: unknown) => {
    // 💡 객체나 배열인 경우 바로 pretty-print 처리합니다.
    if (typeof value === 'object' && value !== null) {
      return (
        <pre className={styles.prettyJson}>
          {/* JSON.stringify의 value 타입을 any로 임시 설정 (lint 무시) */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <code>{JSON.stringify(value as any, null, 2)}</code>
        </pre>
      );
    }

    // 💡 문자열인 경우 JSON 파싱을 시도합니다.
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        // 파싱에 성공하면 객체이므로 pretty-print 처리합니다.
        return (
          <pre className={styles.prettyJson}>
            {/* JSON.stringify의 value 타입을 any로 임시 설정 (lint 무시) */}
            {}
            <code>{JSON.stringify(parsed, null, 2)}</code>
          </pre>
        );
      } catch (error) {
        // JSON 문자열이 아니면 일반 텍스트로 표시합니다.
        return <span>{value}</span>;
      }
    }

    // 💡 그 외(숫자, boolean 등)는 문자열로 변환하여 표시합니다.
    return <span>{String(value)}</span>;
  };

  return (
    <div className={`${styles.slotDisplayContainer}`}>
      <h4 className={styles.title}>
        {t('Current Values')}
        <span className={styles.toggleIcon}></span>
      </h4>
      {hasSlots || hasSelectedRow ? (
        <div className={styles.slotList}>
          {Object.entries(slots || {}).map(([key, value]) => (
            <div key={key} className={styles.slotItem}>
              <span className={styles.slotKey}>{key}:</span>
              <div className={styles.slotValue}>{renderValue(value)}</div>
            </div>
          ))}
          {hasSelectedRow && (
            <div
              key="selectedRow"
              className={styles.slotItem}
              style={{ borderTop: '1px dashed #ccc', paddingTop: '8px' }}
            >
              <span className={styles.slotKey} style={{ color: '#e74c3c' }}>
                {t('selectedRow')}:
              </span>
              <div className={styles.slotValue}>{renderValue(selectedRow)}</div>
            </div>
          )}
        </div>
      ) : (
        <p className={styles.placeholder}>{t('No values set yet')}.</p>
      )}
    </div>
  );
}

export default SlotPanel;
