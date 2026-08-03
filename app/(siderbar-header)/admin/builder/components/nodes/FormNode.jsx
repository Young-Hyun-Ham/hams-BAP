// (Handle, Position 임포트 제거)
import styles from './ChatNodes.module.css';
import { useBuilderStore } from '../../store/index';
// (AnchorIcon, StartNodeIcon 임포트 제거)
import { formatDisplayKeys } from '../../utils/gridUtils';
import NodeWrapper from './NodeWrapper';
import { useTranslation } from 'react-i18next';

function FormNode({ id, data }) {
  const { t } = useTranslation();
  // 2. 공통 로직 제거
  const nodeColor = useBuilderStore((state) => state.nodeColors.form);
  const textColor = useBuilderStore((state) => state.nodeTextColors.form);

  const normalizeOption = (option, fallbackIndex) => {
    if (option && typeof option === 'object') {
      const value = option.value ?? `Option ${fallbackIndex + 1}`;
      return {
        value,
        label: option.label ?? value,
      };
    }

    const value = option ?? `Option ${fallbackIndex + 1}`;
    return {
      value,
      label: value,
    };
  };

  const fallbackOptions = [
    { value: 'Option 1', label: 'Option 1' },
    { value: 'Option 2', label: 'Option 2' },
  ];

  const renderElementPreview = (element) => {
    // ... (기존 renderElementPreview 함수 내용은 동일)
    switch (element.type) {
      case 'input':
        return (
          <div key={element.id} className={styles.previewElement}>
            <label className={styles.previewLabel}>
              {element.label || 'Input'}
            </label>
            <input
              type="text"
              className={styles.previewInput}
              placeholder={element.placeholder || ''}
              readOnly
            />
          </div>
        );
      case 'search':
        return (
          <div key={element.id} className={styles.previewElement}>
            <label className={styles.previewLabel}>
              {element.label || 'Search'}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="text"
                className={styles.previewInput}
                placeholder={element.placeholder || ''}
                readOnly
                value={element.defaultValue || ''}
                style={{ flexGrow: 1 }}
              />
              <span style={{ padding: '0 4px', fontSize: '1.2rem' }}>🔍</span>
            </div>
            {element.resultSlot && (
              <div className={styles.slotBindingInfo}>
                {t('Result Slot')}: {`{${element.resultSlot}}`}
              </div>
            )}
          </div>
        );
      case 'date':
        return (
          <div key={element.id} className={styles.previewElement}>
            <label className={styles.previewLabel}>
              {element.label || 'Date'}
            </label>
            <input
              type="text"
              className={styles.previewInput}
              placeholder="YYYY-MM-DD"
              readOnly
            />
          </div>
        );
      case 'grid':
        return (
          <div key={element.id} className={styles.previewElement}>
            <label className={styles.previewLabel}>
              {element.label || 'Grid'}
            </label>
            {element.optionsSlot && (
              <div className={styles.slotBindingInfo}>
                {t('Bound to')}: {`{${element.optionsSlot}}`}
              </div>
            )}
            {/* --- 💡 수정된 부분 시작 (formatDisplayKeys 헬퍼 사용) --- */}
            {element.optionsSlot &&
              element.displayKeys &&
              element.displayKeys.length > 0 && (
                <div
                  className={styles.slotBindingInfo}
                  style={{
                    fontStyle: 'normal',
                    color: '#555',
                    fontSize: '0.7rem',
                  }}
                >
                  {t('Displaying')}: {formatDisplayKeys(element.displayKeys)}
                </div>
              )}
            {/* --- 💡 수정된 부분 끝 --- */}
            <table className={styles.previewGridTable}>
              <tbody>
                {[...Array(element.rows || 2)].map((_, rowIndex) => (
                  <tr key={rowIndex}>
                    {[...Array(element.columns || 2)].map((_, colIndex) => {
                      const cellIndex =
                        rowIndex * (element.columns || 2) + colIndex;
                      // Ensure data exists and access element safely
                      const cellValue =
                        element.data && element.data[cellIndex] !== undefined
                          ? element.data[cellIndex]
                          : '';
                      return <td key={colIndex}>{cellValue}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'checkbox':
        return (
          <div key={element.id} className={styles.previewElement}>
            <label className={styles.previewLabel}>
              {element.label || 'Checkbox'}
            </label>
            <div className={styles.previewOptionsContainer}>
              {(element.options && element.options.length > 0
                ? element.options
                : fallbackOptions
              ).map((opt, i) => {
                const option = normalizeOption(opt, i);
                return (
                  <div
                    key={option.value || i}
                    className={styles.previewCheckbox}
                  >
                    <input
                      type="checkbox"
                      id={`${element.id}-${i}`}
                      checked={false}
                      readOnly
                    />
                    <label htmlFor={`${element.id}-${i}`}>{option.label}</label>
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 'dropbox':
        // optionsSlot이 있고, fallback 옵션이 없으면 기본 옵션 표시
        const displayOptions =
          element.optionsSlot &&
          (!element.options || element.options.length === 0)
            ? fallbackOptions
            : element.options || fallbackOptions;

        return (
          <div key={element.id} className={styles.previewElement}>
            <label className={styles.previewLabel}>
              {element.label || 'Dropbox'}
            </label>
            {element.optionsSlot && (
              <div className={styles.slotBindingInfo}>
                {t('Bound to')}: {`{${element.optionsSlot}}`}
              </div>
            )}
            <select className={styles.previewInput} disabled>
              {displayOptions.map((opt, i) => {
                const option = normalizeOption(opt, i);

                return (
                  <option key={option.value || i} value={option.value}>
                    {option.label}
                  </option>
                );
              })}
            </select>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    // 3. NodeWrapper로 감싸기
    <NodeWrapper
      id={id}
      typeLabel="Form"
      icon={null} // (FormNode는 아이콘이 없었음)
      nodeColor={nodeColor}
      textColor={textColor}
      customClassName={styles.formNodeWrapper} // 4. 너비 조절을 위한 커스텀 클래스 전달
    >
      {/* 5. 기존 nodeBody의 내용만 children으로 전달 */}
      <div className={styles.section}>
        {/* Form Title is now readOnly, edited in Controller */}
        <input
          className={`${styles.textInput} ${styles.formTitleInput}`}
          value={data.title}
          readOnly // Controller에서 수정하므로 readOnly로 변경
          placeholder={t('Form Title')}
        />
        {data.enableExcelUpload && (
          <div className={styles.formFeatureIndicator}>
            ({t('Excel Upload Enabled')})
          </div>
        )}
      </div>
      <div className={styles.formPreview}>
        {data.elements && data.elements.length > 0 ? (
          data.elements.map(renderElementPreview)
        ) : (
          <div className={styles.formElementsPlaceholder}>
            {t('No elements added yet')}.
          </div>
        )}
      </div>
    </NodeWrapper>
  );
}

export default FormNode;
