import { useState, useEffect } from 'react';
import { useModal } from '@/providers/ModalProvider';

import { useBuilderStore } from '../../store/index';
import styles from '../NodeController.module.css';
import * as backendService from '../../services/backendService';
import ApiTemplateModal from '../modals/ApiTemplateModal';

import { useNodeController } from './hooks/useNodeController';
import ChainNextCheckbox from './common/ChainNextCheckbox';

import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

function ApiCallEditor({ apiCall, onUpdate, onDelete, onTest, isTesting }) {
  const { t } = useTranslation();
  const handleUpdate = (field, value) => {
    onUpdate({ ...apiCall, [field]: value });
  };

  const handleMappingChange = (index, part, value) => {
    const newMapping = [...(apiCall.responseMapping || [])];
    newMapping[index] = { ...newMapping[index], [part]: value };
    handleUpdate('responseMapping', newMapping);
  };

  const addMapping = () => {
    const newMapping = [
      ...(apiCall.responseMapping || []),
      { path: '', slot: '' },
    ];
    handleUpdate('responseMapping', newMapping);
  };

  const deleteMapping = (index) => {
    const newMapping = (apiCall.responseMapping || []).filter(
      (_, i) => i !== index,
    );
    handleUpdate('responseMapping', newMapping);
  };

  return (
    <div className={styles.elementEditor}>
      <div className={styles.formGroup}>
        <label>{t('API Call Name')}</label>
        <input
          type="text"
          value={apiCall.name || ''}
          onChange={(e) => handleUpdate('name', e.target.value)}
        />
      </div>
      <div className={styles.formGroup}>
        <label>{t('Method')}</label>
        <select
          value={apiCall.method || 'GET'}
          onChange={(e) => handleUpdate('method', e.target.value)}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>
      <div className={styles.formGroup}>
        <label>{t('URL')}</label>
        <textarea
          value={apiCall.url || ''}
          onChange={(e) => handleUpdate('url', e.target.value)}
          rows={3}
        />
      </div>
      <div className={styles.formGroup}>
        <label>
          {t('Headers')} ({t('JSON')})
        </label>
        <textarea
          value={apiCall.headers || '{}'}
          onChange={(e) => handleUpdate('headers', e.target.value)}
          rows={4}
        />
      </div>
      {apiCall.method !== 'GET' && (
        <div className={styles.formGroup}>
          <label>
            {t('Body')} ({t('JSON')})
          </label>
          <textarea
            value={apiCall.body || '{}'}
            onChange={(e) => handleUpdate('body', e.target.value)}
            rows={6}
          />
        </div>
      )}
      <div className={styles.separator} />
      <div className={styles.formGroup}>
        <label>{t('Response Mapping')}</label>
        <div className={styles.repliesContainer}>
          {(apiCall.responseMapping || []).map((mapping, index) => (
            <div key={index} className={styles.quickReply}>
              <input
                className={styles.quickReplyInput}
                value={mapping.path}
                onChange={(e) =>
                  handleMappingChange(index, 'path', e.target.value)
                }
                placeholder="JSON Path (e.g., data.name)"
              />
              <input
                className={styles.quickReplyInput}
                value={mapping.slot}
                onChange={(e) =>
                  handleMappingChange(index, 'slot', e.target.value)
                }
                placeholder={t('Slot Name')}
              />
              <button
                onClick={() => deleteMapping(index)}
                className={styles.deleteReplyButton}
              >
                ×
              </button>
            </div>
          ))}
          <button onClick={addMapping} className={styles.addReplyButton}>
            + {t('Add Mapping')}
          </button>
        </div>
      </div>
      <div className={styles.editorActions}>
        <button
          className={styles.testApiButton}
          onClick={() => onTest(apiCall)}
          disabled={isTesting}
        >
          {isTesting ? t('Testing...') : t('Test')}
        </button>
        <button
          className={styles.deleteElementButton}
          onClick={() => onDelete(apiCall.id)}
        >
          {t('Delete')}
        </button>
      </div>
    </div>
  );
}

function ApiNodeController({ localNode, setLocalNode, backend }) {
  const { showAlert, showConfirm } = useAlert();
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [apiTemplates, setApiTemplates] = useState([]);
  const [selectedApiCallId, setSelectedApiCallId] = useState(null);
  // 3. 훅 사용 및 로컬 함수 제거
  const { handleLocalDataChange } = useNodeController(setLocalNode);

  const [isTestingSingle, setIsTestingSingle] = useState(false);
  const [testingApiCallId, setTestingApiCallId] = useState(null);

  // 20260325 - hyh
  const { t } = useTranslation();
  const router = useRouter();
  const [isRouterModalOpen, setIsRouterModalOpen] = useState(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  // const { setApiMainParams } = useApiMainStore();

  const handleSelectRouter = (router) => {
    handleLocalDataChange('routerId', router.id || '');
    setIsRouterModalOpen(false);
  };
  const handleClearRouterId = () => {
    handleLocalDataChange('routerId', '');
  };
  const handleApiDetailCall = () => {
    // setApiMainParams({
    //   routerId: localNode.data.routerId,
    //   apiId: '',
    //   userQuestion: '',
    //   paramSetId: '',
    // });
    router.push(`/management/api-main`);
  };
  const handleSelectApi = (api) => {
    handleLocalDataChange('apiId', api.id || '');
    setIsApiModalOpen(false);
  };
  const handleClearApiId = () => {
    handleLocalDataChange('apiId', '');
  };

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        // const templates = await backendService.fetchApiTemplates(backend);
        // setApiTemplates(templates);
      } catch (error) {
        console.error('Failed to fetch API templates:', error);
      }
    };
    fetchTemplates();
  }, [backend]);

  const handleSaveTemplate = async (templateName) => {
    const { isMulti, apis, ...singleApiData } = localNode.data;
    let templateData;

    if (isMulti) {
      if (!selectedApiCallId) {
        await showAlert(
          t('Please select an API call from the list to save as a template.'),
        );
        return;
      }
      const selectedApi = apis.find((api) => api.id === selectedApiCallId);
      templateData = { name: templateName, ...selectedApi };
      delete templateData.id;
    } else {
      templateData = {
        name: templateName,
        method: singleApiData.method,
        url: singleApiData.url,
        headers: singleApiData.headers,
        body: singleApiData.body,
        responseMapping: singleApiData.responseMapping,
      };
    }

    try {
      const savedTemplate = await backendService.saveApiTemplate(
        backend,
        templateData,
      );
      setApiTemplates((prev) => [...prev, savedTemplate]);
      setIsTemplateModalOpen(false);
    } catch (error) {
      console.error('Failed to save API template:', error);
      await showAlert(t('Failed to save template.'));
    }
  };

  const handleLoadTemplate = (template) => {
    const { name, ...templateData } = template;

    setLocalNode((prev) => {
      const newData = { ...prev.data };
      if (newData.isMulti) {
        if (!selectedApiCallId) {
          showAlert(
            t('Please select an API call from the list to apply the template.'),
          );
          return prev;
        }
        newData.apis = newData.apis.map((api) =>
          api.id === selectedApiCallId ? { ...api, ...templateData } : api,
        );
      } else {
        Object.assign(newData, templateData);
      }
      return { ...prev, data: newData };
    });
    setIsTemplateModalOpen(false);
  };

  const handleDeleteTemplate = async (templateId) => {
    const confirmed = await showConfirm(
      t(
        'Are you sure you want to delete this template? This action cannot be undone.',
      ),
    );
    if (confirmed) {
      try {
        await backendService.deleteApiTemplate(backend, templateId);
        setApiTemplates((prev) => prev.filter((t) => t.id !== templateId));
      } catch (error) {
        console.error('Failed to delete API template:', error);
        await showAlert(t('Failed to delete template.'));
      }
    }
  };

  const handleTestApiCall = async (apiCall) => {
    if (localNode.data.isMulti) {
      if (testingApiCallId) return;
      setTestingApiCallId(apiCall.id);
    } else {
      if (isTestingSingle) return;
      setIsTestingSingle(true);
    }

    try {
      const result = await backendService.testApiCall(apiCall);
      await showAlert(
        `API Test Success!\n\nResponse:\n${JSON.stringify(result, null, 2)}`,
      );
    } catch (error) {
      await showAlert(`API Test Failed:\n${error.message}`);
    } finally {
      if (localNode.data.isMulti) {
        setTestingApiCallId(null);
      } else {
        setIsTestingSingle(false);
      }
    }
  };

  const handleApiMultiToggle = async (e) => {
    const isMulti = e.target.checked;

    if (!isMulti && (localNode.data.apis?.length || 0) > 1) {
      const confirmed = await showConfirm(
        t(
          "Disabling Multi API will keep only the first API call's configuration. All other API calls will be removed. Are you sure you want to continue?",
        ),
      );
      if (!confirmed) {
        e.target.checked = true;
        return;
      }
    }

    setLocalNode((prev) => {
      const newData = { ...prev.data, isMulti };
      if (isMulti) {
        if (!newData.apis || newData.apis.length === 0) {
          newData.apis = [
            {
              id: `api-call-${Date.now()}`,
              name: 'API Call 1',
              method: prev.data.method,
              url: prev.data.url,
              headers: prev.data.headers,
              body: prev.data.body,
              responseMapping: prev.data.responseMapping,
            },
          ];
        }
      } else {
        const firstApi = prev.data.apis?.[0] || {};
        newData.method = firstApi.method || 'GET';
        newData.url = firstApi.url || '';
        newData.headers = firstApi.headers || '{}';
        newData.body = firstApi.body || '{}';
        newData.responseMapping = firstApi.responseMapping || [];
        newData.apis = [];
      }
      return { ...prev, data: newData };
    });
  };

  const renderSingleApiControls = () => {
    const { data } = localNode;
    // 4. 훅의 handleLocalDataChange를 사용하도록 수정
    const handleMappingChange = (index, part, value) => {
      const newMapping = [...(data.responseMapping || [])];
      newMapping[index] = { ...newMapping[index], [part]: value };
      handleLocalDataChange('responseMapping', newMapping); // 훅 함수 사용
    };
    const addMapping = () => {
      const newMapping = [
        ...(data.responseMapping || []),
        { path: '', slot: '' },
      ];
      handleLocalDataChange('responseMapping', newMapping); // 훅 함수 사용
    };
    const deleteMapping = (index) => {
      const newMapping = (data.responseMapping || []).filter(
        (_, i) => i !== index,
      );
      handleLocalDataChange('responseMapping', newMapping); // 훅 함수 사용
    };

    return (
      <>
        <div className={styles.formGroup}>
          <label>{t('Method')}</label>
          <select
            value={data.method || 'GET'}
            onChange={(e) => handleLocalDataChange('method', e.target.value)}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label>{t('URL')}</label>
          <textarea
            value={data.url || ''}
            onChange={(e) => handleLocalDataChange('url', e.target.value)}
            rows={3}
          />
        </div>
        <div className={styles.formGroup}>
          <label>
            {t('Headers')} ({t('JSON')})
          </label>
          <textarea
            value={data.headers || '{}'}
            onChange={(e) => handleLocalDataChange('headers', e.target.value)}
            rows={4}
          />
        </div>
        {data.method !== 'GET' && (
          <div className={styles.formGroup}>
            <label>
              {t('Body')} ({t('JSON')})
            </label>
            <textarea
              value={data.body || '{}'}
              onChange={(e) => handleLocalDataChange('body', e.target.value)}
              rows={6}
            />
          </div>
        )}
        <div className={styles.separator} />
        <div className={styles.formGroup}>
          <label>{t('Response Mapping')}</label>
          <div className={styles.repliesContainer}>
            {(data.responseMapping || []).map((mapping, index) => (
              <div key={index} className={styles.quickReply}>
                <input
                  className={styles.quickReplyInput}
                  value={mapping.path}
                  onChange={(e) =>
                    handleMappingChange(index, 'path', e.target.value)
                  }
                  placeholder={t('JSON Path (e.g., data.name)')}
                />
                <input
                  className={styles.quickReplyInput}
                  value={mapping.slot}
                  onChange={(e) =>
                    handleMappingChange(index, 'slot', e.target.value)
                  }
                  placeholder={t('Slot Name')}
                />
                <button
                  onClick={() => deleteMapping(index)}
                  className={styles.deleteReplyButton}
                >
                  ×
                </button>
              </div>
            ))}
            <button onClick={addMapping} className={styles.addReplyButton}>
              + {t('Add Mapping')}
            </button>
          </div>
        </div>
      </>
    );
  };

  const renderMultiApiControls = () => {
    const apis = localNode.data.apis || [];
    const selectedApiCall = apis.find((api) => api.id === selectedApiCallId);

    const handleAddApiCall = () => {
      const newApiCall = {
        id: `api-call-${Date.now()}`,
        name: `API Call ${apis.length + 1}`,
        method: 'GET',
        url: '',
        headers: '{}',
        body: '{}',
        responseMapping: [],
      };
      handleLocalDataChange('apis', [...apis, newApiCall]); // 훅 함수 사용
    };
    const handleUpdateApiCall = (updatedApiCall) => {
      const newApis = apis.map((api) =>
        api.id === updatedApiCall.id ? updatedApiCall : api,
      );
      handleLocalDataChange('apis', newApis); // 훅 함수 사용
    };
    const handleDeleteApiCall = (apiIdToDelete) => {
      const newApis = apis.filter((api) => api.id !== apiIdToDelete);
      handleLocalDataChange('apis', newApis); // 훅 함수 사용
      if (selectedApiCallId === apiIdToDelete) {
        setSelectedApiCallId(null);
      }
    };

    return (
      <>
        <div className={styles.formGroup}>
          <label>{t('API Calls')}</label>
          <div className={styles.elementsContainer}>
            {apis.map((api) => (
              <div
                key={api.id}
                className={`${styles.elementItem} ${api.id === selectedApiCallId ? styles.selected : ''}`}
                onClick={() => setSelectedApiCallId(api.id)}
              >
                <span>{api.name || t('API Call')}</span>
              </div>
            ))}
            <button
              onClick={handleAddApiCall}
              className={styles.addReplyButton}
            >
              + {t('Add API Call')}
            </button>
          </div>
        </div>
        <div className={styles.separator} />
        {selectedApiCall && (
          <ApiCallEditor
            apiCall={selectedApiCall}
            onUpdate={handleUpdateApiCall}
            onDelete={handleDeleteApiCall}
            onTest={handleTestApiCall}
            isTesting={testingApiCallId === selectedApiCall.id}
          />
        )}
      </>
    );
  };

  return (
    <>
      <ApiTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSave={handleSaveTemplate}
        onSelect={handleLoadTemplate}
        onDelete={handleDeleteTemplate}
        templates={apiTemplates}
        isMulti={localNode.data.isMulti}
        selectedApiCallName={
          localNode.data.isMulti
            ? localNode.data.apis?.find((api) => api.id === selectedApiCallId)
                ?.name
            : null
        }
      />
      <div className={styles.apiMultiToggle}>
        <label htmlFor="multiApiToggle">{t('Enable Multi API')}</label>
        <input
          type="checkbox"
          id="multiApiToggle"
          checked={localNode.data.isMulti || false}
          onChange={handleApiMultiToggle}
        />
      </div>
      {/* 기존 UI를 공통 컴포넌트로 대체 */}
      <ChainNextCheckbox
        checked={localNode.data.chainNext}
        onChange={(value) => handleLocalDataChange('chainNext', value)}
      />
      <div className={styles.templateActions}>
        <button onClick={() => setIsTemplateModalOpen(true)}>
          {t('Templates')}
        </button>
      </div>
      <div className={styles.separator} />

      {/* 신규 라우터 검색 추가 - hyh */}
      <div className={styles.routerModalPopup}>
        <button onClick={() => setIsRouterModalOpen(true)}>
          {t('Router Modal Popup')}
        </button>
        <button onClick={() => setIsApiModalOpen(true)}>
          {t('API Modal Popup')}
        </button>
      </div>

      <div className={styles.formGroup}>
        <label>{t('Router ID')}</label>
        <div
          style={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            value={localNode.data.routerId || ''}
            readOnly={true}
            style={{
              width: '100%',
              paddingRight: '32px',
              cursor: 'pointer',
            }}
            // onDoubleClick={handleApiDetailCall}
          />
          {localNode.data.routerId && (
            <button
              type="button"
              onClick={handleClearRouterId}
              style={{
                position: 'absolute',
                top: '50%',
                right: '10px',
                transform: 'translateY(-50%)',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: 'transparent',
                color: '#999',
                fontSize: '16px',
                lineHeight: 1,
                cursor: 'pointer',
                padding: 0,
                zIndex: 1,
              }}
            >
              x
            </button>
          )}
        </div>
      </div>
      <div className={styles.formGroup}>
        <label>{t('API ID')}</label>
        <div
          style={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            value={localNode.data.apiId || ''}
            readOnly={true}
            style={{
              width: '100%',
              paddingRight: '32px',
              cursor: 'pointer',
            }}
            // onDoubleClick={handleApiDetailCall}
          />
          {localNode.data.apiId && (
            <button
              type="button"
              onClick={handleClearApiId}
              style={{
                position: 'absolute',
                top: '50%',
                right: '10px',
                transform: 'translateY(-50%)',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                background: 'transparent',
                color: '#999',
                fontSize: '16px',
                lineHeight: 1,
                cursor: 'pointer',
                padding: 0,
                zIndex: 1,
              }}
            >
              x
            </button>
          )}
        </div>
      </div>

      <div className={styles.separator} />
      {localNode.data.isMulti
        ? renderMultiApiControls()
        : renderSingleApiControls()}
    </>
  );
}

export default ApiNodeController;
