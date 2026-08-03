import { useState, useEffect } from 'react';
import styles from '../NodeController.module.css';
import { useNodeController } from './hooks/useNodeController';
import ChainNextCheckbox from './common/ChainNextCheckbox';
import { useTranslation } from 'react-i18next';

const MOCK_DATA = {
  msgId: 'alskdjf-as123lkf-1212fd2',
  textEn: 'hello',
  textKo: '안녕',
  textJp: 'こんにちは',
  textVn: 'Xin chào',
};

function MessageNodeController({ localNode, setLocalNode }) {
  const { t } = useTranslation();
  const { data } = localNode;
  const { handleLocalDataChange, addReply, updateReply, deleteReply } =
    useNodeController(setLocalNode);

  const [loadingData, setLoadingData] = useState({ msgId: '' });
  const onClickLangeuage = () => {
    setLoadingData(MOCK_DATA);
    handleLocalDataChange('content', MOCK_DATA.textKo);

    handleLocalDataChange('msgId', MOCK_DATA.msgId);
    handleLocalDataChange('textKo', MOCK_DATA.textKo);
    handleLocalDataChange('textEn', MOCK_DATA.textEn);
    handleLocalDataChange('textJp', MOCK_DATA.textJp);
    handleLocalDataChange('textVn', MOCK_DATA.textVn);
  };

  const onChangeLanguage = (value) => {
    switch (value) {
      case 'ko':
        handleLocalDataChange('content', MOCK_DATA.textKo);
        break;
      case 'en':
        handleLocalDataChange('content', MOCK_DATA.textEn);
        break;
      case 'jp':
        handleLocalDataChange('content', MOCK_DATA.textJp);
        break;
      case 'vn':
        handleLocalDataChange('content', MOCK_DATA.textVn);
        break;
      default:
        handleLocalDataChange('content', MOCK_DATA.textEn);
        break;
    }
  };
  return (
    <>
      <div className={styles.formGroup}>
        <button className={styles.addReplyButton} onClick={onClickLangeuage}>
          + {t('Language modal popup')}
        </button>
      </div>
      <div className={styles.formGroup}>
        <label>{t('modal response Data')}</label>
        <p
          className={styles.instructionText}
          style={{ marginTop: 0, fontSize: '0.8rem' }}
        >
          {loadingData ? JSON.stringify(loadingData) : `{}`}
        </p>
      </div>
      <div className={styles.formGroup}>
        <label>{t('Language')}</label>
        <input
          value={loadingData.msgId}
          // onChange={(e) => updateReply(index, 'display', e.target.value)}
          placeholder={t('msgId')}
          readOnly
        />
        <select
          // value={apiCall.method || 'GET'}
          onChange={(e) => onChangeLanguage(e.target.value)}
        >
          <option value="ko">Korean</option>
          <option value="en">English</option>
          <option value="jp">Japenen</option>
          <option value="vn">Viet Namese</option>
        </select>
        <label>{t('Content')}</label>
        <textarea
          value={data.content || ''}
          onChange={(e) => handleLocalDataChange('content', e.target.value)}
          rows={4}
        />
      </div>
      {/* 2. 기존 UI를 공통 컴포넌트로 대체 */}
      <ChainNextCheckbox
        checked={data.chainNext}
        onChange={(value) => handleLocalDataChange('chainNext', value)}
      />
      <div className={styles.formGroup}>
        <label>{t('save node Data')}</label>
        <p
          className={styles.instructionText}
          style={{ marginTop: 0, fontSize: '0.8rem' }}
        >
          {data ? JSON.stringify(data) : `{}`}
        </p>
      </div>
      {/* <div className={styles.formGroup}>
        <label>{t('Quick Replies')}</label>
        <div className={styles.repliesContainer}>
          {data.replies?.map((reply, index) => (
            <div key={reply.value || index} className={styles.quickReply}>
              <input
                className={styles.quickReplyInput}
                value={reply.display}
                onChange={(e) => updateReply(index, 'display', e.target.value)}
                placeholder={t('Display text')}
              />
              <input
                className={styles.quickReplyInput}
                value={reply.value}
                onChange={(e) => updateReply(index, 'value', e.target.value)}
                placeholder={t('Actual value')}
              />
              <button
                onClick={() => deleteReply(index)}
                className={styles.deleteReplyButton}
              >
                ×
              </button>
            </div>
          ))}
          <button onClick={addReply} className={styles.addReplyButton}>
            + {t('Add Reply')}
          </button>
        </div>
      </div> */}
    </>
  );
}

export default MessageNodeController;
