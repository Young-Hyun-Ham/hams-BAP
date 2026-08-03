import apiClient from '@/lib/api/apiClient';

const TENANT_ID = '1000';
const STAGE_ID = 'DEV';

export const fetchScenarios = async (sParam: any) => {
  const getUrl = `/chat/builder/scenarios
    ?skip=0
    &limit=100
    ${sParam?.name ? '&name=' + sParam?.name : ''}
    ${sParam?.type ? '&category_id=' + (sParam?.type ? '' : '') : ''}
  `;
  const data: any = await apiClient.get(getUrl.replace(/\s/g, ''));
  const scenarios = data?.scenarios || (Array.isArray(data) ? data : []);
  return scenarios.map((scenario: any) => ({
    ...scenario,
    job: scenario.job || 'Process',
    description: scenario.description || '',
    updatedAt: scenario.updated_at || null,
    lastUsedAt: scenario.last_used_at || null,
  }));
};

export const createScenario = async (payload: any) => {
  return await apiClient.post(`/chat/builder/scenarios`, payload);
};

export const cloneScenario = async (payload: any) => {
  // console.log('cloneScenario =====> ', payload);
  return await apiClient.get(
    `/chat/builder/scenarios/clone/${payload.clone_from_id}`,
  );
};

export const patchScenario = async (scenario: any) => {
  const patchUrl = `/chat/builder/scenarios/${scenario.id}`;
  const res: any = await apiClient.patch(patchUrl.replace(/\s/g, ''), scenario);
  return {
    ...res,
    startNodeId: res.start_node_id,
    description: res.description || '',
  };
};

export const deleteScenario = async (datas: string[]) => {
  return await apiClient.post(`/chat/builder/scenarios/delete`, datas);
};

export const fetchScenarioData = async (scenarioId: string) => {
  if (!scenarioId)
    return { nodes: [], edges: [], startNodeId: null, description: '' };

  const getUrl = `/chat/builder/scenarios/${scenarioId}`;
  const data: any = await apiClient.get(getUrl.replace(/\s/g, ''));
  return {
    ...data,
    nodes: data.nodes || [],
    edges: data.edges || [],
    startNodeId: data.start_node_id || null,
    description: data.description || '',
  };
};

export const saveScenarioData = async ({ scenario, data }: any) => {
  if (!scenario || !scenario.id) {
    throw new Error('No scenario selected to save.');
  }

  const payload = {
    ten_id: TENANT_ID,
    stg_id: STAGE_ID,
    // name: scenario.name,
    job: scenario.job,
    description: scenario.description || '',
    nodes: data.nodes,
    edges: data.edges,
    start_node_id: data.startNodeId,
    version_yn: scenario.version_yn ?? false,
  };
  // console.log('saveScenarioData =====>', payload);
  // return;
  const patchUrl = `/chat/builder/scenarios/${scenario.id}`;
  const res: any = await apiClient.patch(patchUrl.replace(/\s/g, ''), payload);
  // console.log('save response data =====>', res);
  return {
    ...res,
  };
};

export const getScenarioVersions = async (payload: any) => {
  // console.log('getScenarioVersions =====> ', payload);
  return await apiClient.get(
    `/chat/builder/scenarios/version/${payload.scenario_id}`,
  );
};

export const getScenarioVersion = async (payload: any) => {
  // console.log('getScenarioVersions =====> ', payload);
  return await apiClient.get(
    `/chat/builder/scenarios/version/${payload.scenario_id}/${payload.version_id}`,
  );
};

export const scenarioVersionDeploy = async (payload: any) => {
  // console.log('getScenarioVersions =====> ', payload);
  return await apiClient.post(`/chat/builder/scenarios/deploy`, payload);
};

export const getScenarioDeployHistory = async (payload: any) => {
  // console.log('getScenarioVersions =====> ', payload);
  return await apiClient.get(
    `/chat/builder/scenarios/deploy/${payload.scenario_id}`,
  );
};
