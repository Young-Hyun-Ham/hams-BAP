'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { AddCircle } from '@mui/icons-material';
import { Box, Button, IconButton, Typography, Dialog } from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import BuildIcon from '@mui/icons-material/Build';
import { format } from 'date-fns';

import { useBuilderStore } from '../../store/index';
import { Scenario } from '../../types/types';
import { ScenarioCard } from '../../components/ScenarioCard';

import { COLORS } from '@/lib/constants/color';
import SelectWithLabel from '@/components/common/Select';
import InputWithLabel from '@/components/common/Input';
import { formatDateTime } from '../../utils/util';
import { AppLoadingOverlay } from '@/components/common/AppLoadingOverlay';
import { useModal } from '@/providers/ModalProvider';

const SCENARIO_SEARCH_OPTIONS = [{ label: 'Scenario Name', value: 'scenario' }];

type SearchFilter = {
  type?: string;
  name?: string;
  deployment?: string;
  period?: string;
  sortOrder?: string;
};

type MODE = 'create' | 'edit' | null;

// ===========================================
type ScenarioItem = Scenario & {
  groupId?: string;
  versions?: string;
  isDistribute?: boolean;
};

// ===========================================

const ScenarioList = () => {
  const { t } = useTranslation();
  const { showAlert } = useModal();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<MODE>(null);
  const [selectedScenario, setSelectedScenario] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState('');

  const {
    scenario,
    setScenario,
    scenarios,
    setScenarios,
    fetchScenario,
    fetchScenarios,
    createScenario,
    patchScenario,
    deleteScenario,
    cloneScenario,
    setNodes,
    setEdges,
    setStartNodeId,
  } = useBuilderStore() as any;

  const {
    register,
    handleSubmit,
    reset,
    getValues: getSearchValues,
  } = useForm<SearchFilter>({
    defaultValues: {
      type: 'scenario',
      name: '',
      deployment: 'all',
      period: 'all',
      sortOrder: 'updated',
    },
  });
  const onSubmit = (data?: SearchFilter, keepEditorOpen?: boolean) => {
    // console.log('search data : ', data);
    loadAll([fetchData(data, keepEditorOpen)]);
  };

  const loadAll = useCallback(async (tasks: any) => {
    setLoading(true);
    try {
      await Promise.all(tasks);
    } catch (err) {
      alert('Something wrong!!!');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchData = useCallback(
    async (filters?: SearchFilter, keepEditorOpen?: boolean) => {
      try {
        if (!keepEditorOpen) {
          setMode(null);
          setSelectedScenario(false);
        }
        const data: any = await fetchScenarios(filters);
        // console.log('==========================> fetchData : ', data, );
        // Sort based on sortOrder (default: 'updated')
        const sortOrder = filters?.sortOrder || 'updated';
        let sortedData = [...data];

        if (sortOrder === 'name') {
          // Sort alphabetically by name (A-Z)
          sortedData.sort((a: any, b: any) => {
            const nameA = a.name || '';
            const nameB = b.name || '';
            return nameA.localeCompare(nameB, 'ko', { sensitivity: 'base' });
          });
        } else if (sortOrder === 'deployed') {
          // Sort by deployment (latest deployment first)
          sortedData.sort((a: any, b: any) => {
            if (a.depn_ver_id && !b.depn_ver_id) return -1;
            if (!a.depn_ver_id && b.depn_ver_id) return 1;
            if (a.depn_ver_id && b.depn_ver_id) {
              const valA = String(a.depn_ver_id);
              const valB = String(b.depn_ver_id);
              return valB.localeCompare(valA, undefined, { numeric: true });
            }
            const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
            const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
            return dateB - dateA;
          });
        } else {
          // Default: Sort descending by updated_at (latest first)
          sortedData.sort((a: any, b: any) => {
            const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
            const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
            return dateB - dateA;
          });
        }

        // Filter by deployment status
        if (filters?.deployment === 'deployed') {
          sortedData = sortedData.filter((s: any) => !!s.depn_ver_id);
        } else if (filters?.deployment === 'undeployed') {
          sortedData = sortedData.filter((s: any) => !s.depn_ver_id);
        }

        // Filter by period (today, week, all)
        const period = filters?.period || 'all';
        if (period === 'today') {
          const startOfToday = new Date();
          startOfToday.setHours(0, 0, 0, 0);
          sortedData = sortedData.filter((s: any) => {
            const date = s.updated_at || s.updatedAt;
            return date
              ? new Date(date).getTime() >= startOfToday.getTime()
              : false;
          });
        } else if (period === 'week') {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          sortedData = sortedData.filter((s: any) => {
            const date = s.updated_at || s.updatedAt;
            return date
              ? new Date(date).getTime() >= oneWeekAgo.getTime()
              : false;
          });
        }

        setScenarios(sortedData);
      } catch (error) {
        console.error('Error fetching rows:', error);
        throw new Error('Failed to fetch');
      }
    },
    [scenarios, setScenarios],
  );

  useEffect(() => {
    onSubmit(getSearchValues());
  }, []);

  const {
    register: formRegister,
    handleSubmit: handleFormSubmit,
    reset: formReset,
    control,
    getValues,
    setValue,
  } = useForm<any>({
    defaultValues: {
      id: '',
      name: '',
      description: '',
      created_at: '',
      updated_at: '',
      last_used_at: '',
    },
  });
  const onFormSubmit = (data?: any) => {
    console.log(data);
  };

  useEffect(() => {
    const getScenario = async () => {
      try {
        setLoading(true);
        setSelectedScenario(true);

        const [scenarioData] = await Promise.all([fetchScenario(scenario?.id)]);
        // console.log('==========================> 재조회 scenarioData : ', scenario);
        if (scenarioData) {
          formReset({
            id: scenarioData.id,
            name: scenarioData.name,
            description: scenarioData.description,
            created_at: formatDateTime(scenarioData.created_at || scenarioData.createdAt),
            updated_at: formatDateTime(scenarioData.updated_at || scenarioData.updatedAt),
            last_used_at: formatDateTime(scenarioData.last_used_at || scenarioData.lastUsedAt),
          });
        }
      } catch (e: any) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    if (mode === 'edit') {
      getScenario();
    } else {
      const createData: any[] = scenarios.filter((item: any) => !item.id);
      formReset({
        id: createData[0]?.id ?? '',
        name: createData[0]?.name ?? '',
        description: createData[0]?.description ?? '',
        created_at: formatDateTime(createData[0]?.created_at) ?? '',
        updated_at: formatDateTime(createData[0]?.updated_at) ?? '',
        last_used_at: formatDateTime(createData[0]?.updated_at) ?? '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, scenario?.id, formReset]);

  const handleSelectScenario = async (data?: Scenario) => {
    // console.log('select scenario ==================> : ', data);
    setMode(data?.id ? 'edit' : 'create');
    setSelectedScenario(true);
    setScenario(data);
    setSelectedScenarioId(data?.id ?? '');
  };

  const handleAddScenario = async () => {
    const isChk = scenarios.some((item: any) => !item.id);
    if (isChk) return;

    formReset({
      id: '',
      name: '',
      description: '',
      created_at: '',
      updated_at: '',
      last_used_at: '',
    });

    const data: Scenario = {
      name: '',
      description: '',
    };
    await setScenarios([data, ...scenarios]);

    setMode('create');
    setSelectedScenario(true);
    setScenario(data);
    setSelectedScenarioId('');
  };

  const handleMoveScenario = async (data?: Scenario) => {
    if (data?.id) {
      setMode(null);
      setScenario(data);
      router.push(`/admin/builder/react-flow/scenario-flow`);
    }
  };

  const handleMoveTempScenario = async (data?: Scenario) => {
    if (data?.id) {
      setMode(null);
      setScenario(data);
      router.push(`/admin/builder/react-flow/scenario-flow`);
    }
  };
  const handleVersionViewScenario = async (data?: Scenario) => {
    if (data?.id) {
      setMode(null);
      setScenario(data);
      setEdges([]);
      setStartNodeId(null);
      router.push(`/admin/builder/react-flow/scenario-view`);
    }
  };

  const handleEditScenario = async (data: Scenario) => {
    setMode('edit');
    // console.log('==========================> Edit : ', data);
    setScenario(data);
    setSelectedScenarioId(data?.id ?? '');
  };

  const handleDeleteScenario = async (data?: Scenario) => {
    // console.log('==========================> Delete : ', data);
    const deleteDatas: string[] = [];
    deleteDatas.push(data?.id ?? '');
    await deleteScenario(deleteDatas);
    onSubmit();
  };

  const handleSaveScenario = async () => {
    const payload = {
      ...getValues(),
      id: scenario.id,
    };
    // console.log('==========================> save : ', mode, payload);
    let res: any = null;
    if (mode === 'edit') {
      const { name, nodes, edges, start_node_id, ...patchData } = payload;
      res = await patchScenario(patchData);
    } else {
      res = await createScenario(payload);
      if (res) {
        setMode('edit');
        setScenario(res);
        setSelectedScenarioId(res.id ?? '');
      }
    }
    onSubmit(getSearchValues(), true);
    showAlert('저장되었습니다',);
  };

  const handleDataChange = (type: string, data: string) => {
    const selectedId = scenario.id;

    setScenarios(
      scenarios.map((s: Scenario) => {
        if (selectedId && s.id === selectedId) {
          return { ...s, [type]: data };
        }
        if (!selectedId && !s.id) {
          return { ...s, [type]: data };
        }
        return s;
      }),
    );
  };

  const handleCloneScenario = async (data: Scenario) => {
    const resData = await fetchScenario(data?.id);
    const newData = {
      ...resData,
      clone_from_id: data.id,
      id: '',
      name: `[clone]_${data.name}`,
    };
    await cloneScenario(newData);
    onSubmit();
  };

  return (
    <Box
      display={'flex'}
      flexDirection={'column'}
      height={'100%'}
      sx={{ minHeight: 0 }}
    >
      <AppLoadingOverlay loading={loading} />
      <Box sx={{ display: 'flex', flex: 1, minHeight: 0, gap: 1 }}>
        <Box display={'flex'} flexDirection={'column'} flex={1}>
          <Box px={2}>
            <Box
              border={1}
              borderColor={COLORS.blueGrey[100]}
              borderRadius={2}
              p={1.5}
            >
              <form
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
                onSubmit={handleSubmit((data) => onSubmit(data))}
              >
                <SelectWithLabel
                  label={t('Sort Order')}
                  size="small"
                  sx={{ minWidth: 160 }}
                  defaultValue={'updated'}
                  options={[
                    { label: t('Last Updated'), value: 'updated' },
                    { label: t('Name'), value: 'name' },
                    { label: t('Last Deployed'), value: 'deployed' },
                  ]}
                  {...register('sortOrder', {
                    onChange: (e) => {
                      onSubmit({
                        ...getSearchValues(),
                        sortOrder: e.target.value,
                      });
                    },
                  })}
                />
                <SelectWithLabel
                  label={t('Period')}
                  size="small"
                  sx={{ minWidth: 160 }}
                  defaultValue={'all'}
                  options={[
                    { label: t('All'), value: 'all' },
                    { label: t('Today'), value: 'today' },
                    { label: t('1 Week'), value: 'week' },
                  ]}
                  {...register('period', {
                    onChange: (e) => {
                      onSubmit({
                        ...getSearchValues(),
                        period: e.target.value,
                      });
                    },
                  })}
                />
                <SelectWithLabel
                  label={t('Deployment Status')}
                  size="small"
                  sx={{ minWidth: 160 }}
                  defaultValue={'all'}
                  options={[
                    { label: t('All'), value: 'all' },
                    { label: t('Deployed'), value: 'deployed' },
                    { label: t('Not Deployed'), value: 'undeployed' },
                  ]}
                  {...register('deployment', {
                    onChange: (e) => {
                      onSubmit({
                        ...getSearchValues(),
                        deployment: e.target.value,
                      });
                    },
                  })}
                />
                {/* <SelectWithLabel
                  label={t('Type')}
                  size="small"
                  sx={{ minWidth: 160 }}
                  defaultValue={'scenario'}
                  options={SCENARIO_SEARCH_OPTIONS}
                  {...register('type')}
                /> */}
                <InputWithLabel
                  label={t('Name')}
                  sx={{ minWidth: 320 }}
                  size="small"
                  placeholder={t('Please enter your search scenario name')}
                  onKeyDown={(e: any) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit((data) => onSubmit(data))();
                    }
                  }}
                  {...register('name')}
                />
                <Box
                  flex={1}
                  sx={{ alignSelf: 'stretch' }}
                  onClick={() => {
                    setMode(null);
                    setSelectedScenario(false);
                  }}
                />
                <IconButton
                  size="small"
                  onClick={() => {
                    setMode(null);
                    setSelectedScenario(false);
                    reset();
                    setTimeout(() => {
                      onSubmit(getSearchValues());
                    }, 0);
                  }}
                  sx={{
                    border: 1,
                    borderColor: COLORS.blueGrey[100],
                    width: 32,
                    height: 32,
                  }}
                >
                  <RestartAltIcon />
                </IconButton>
                <Button type="submit" variant="contained" size="small">
                  {t('Search')}
                </Button>
              </form>
            </Box>
          </Box>

          {/* List와 Editor를 감싸는 수평 Flex 컨테이너 */}
          <Box
            display={'flex'}
            flexDirection={'row'} // 수평 배치
            flexGrow={1} // 남은 세로 공간 모두 차지
            sx={{ minHeight: 0, overflow: 'hidden' }} // 스크롤은 자식에서 개별 처리
          >
            {/* 1. 시나리오 리스트 영역 */}
            <Box
              flexGrow={1}
              p={2}
              sx={{
                overflow: 'auto',
                minWidth: '184px',
              }}
            >
              <Box
                mt={1.5}
                display={'grid'}
                gap={1.5}
                aria-label="Chunks"
                px={2}
                sx={{
                  gridTemplateColumns: 'repeat(auto-fit, minmax(252px, 1fr))',
                  gridAutoRows: '80px',
                  alignItems: 'stretch',
                }}
              >
                <Box
                  display={'flex'}
                  flexDirection={'column'}
                  sx={{
                    border: '2px dashed',
                    borderColor: COLORS.blueGrey[100],
                    borderRadius: 2,
                    cursor: 'pointer',
                    height: '100%',
                  }}
                  justifyContent={'center'}
                  alignItems={'center'}
                  gap={0.5}
                  onClick={() => {
                    handleAddScenario();
                  }}
                >
                  <AddCircle sx={{ color: 'primary.main' }} />
                  <Typography
                    fontSize={14}
                    fontWeight={500}
                    color="primary.main"
                  >
                    {t('New Job')}
                  </Typography>
                </Box>
                {scenarios.map((data: any, index: any) => (
                  <Fragment key={index}>
                    <ScenarioCard
                      scenario={data}
                      selected={selectedScenarioId === (data.id ?? '')}
                      onSelect={handleSelectScenario}
                      onEdit={handleEditScenario}
                      onDelete={handleDeleteScenario}
                      onMove={handleMoveScenario}
                      onClone={handleCloneScenario}
                    />
                  </Fragment>
                ))}
              </Box>
            </Box>
            {/* // 1. 시나리오 리스트 영역 끝 */}

            {/* 2. 편집 화면 영역 (selectedScenario가 true일 때만 모달 팝업으로 렌더링) */}
            <Dialog
              open={selectedScenario}
              onClose={() => {
                setMode(null);
                setSelectedScenario(false);
              }}
              maxWidth="sm"
              fullWidth
              PaperProps={{
                sx: {
                  borderRadius: 2,
                  border: 2,
                  borderColor: 'primary.main',
                  overflow: 'hidden',
                },
              }}
            >
              <form
                onSubmit={handleFormSubmit(onFormSubmit)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                }}
              >
                {/* 전체 Edit Data 컨테이너 */}
                <Box display={'flex'} flexDirection={'column'} gap={1} p={2}>
                  {/* "Edit Data" 타이틀 */}
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                  >
                    <Typography
                      fontSize={16}
                      fontWeight={700}
                      color="text.primary"
                    >
                      {t('Edit Scenario')}
                    </Typography>

                    <Box display="flex" gap={1}>
                      {/* <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          handleMoveUIPathScenario(scenario);
                        }}
                      >
                        {t('UIPath')}
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          handleMoveScenario(scenario);
                        }}
                      >
                        {t('Edit')}
                      </Button> */}
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          handleMoveTempScenario(scenario);
                        }}
                      >
                        {t('Edit')}
                      </Button>
                    </Box>
                  </Box>

                  {/* 편집 필드 컨테이너 */}
                  <Box
                    display={'flex'}
                    flexDirection={'column'}
                    gap={2}
                    p={2}
                    sx={{
                      borderRadius: 1,
                      background:
                        'linear-gradient(180deg, #FFF 0%, #F7F6FF 100%)',
                      border: '1px solid',
                      borderColor: COLORS.blueGrey[50],
                    }}
                  >
                    <Controller
                      name="name"
                      control={control}
                      render={({ field }) => (
                        <InputWithLabel
                          {...field}
                          fullWidth
                          disabled={mode === 'create' ? false : true}
                          label={`${t('Name')} *`}
                          size="medium"
                          placeholder={t(
                            'Please enter your search scenario name',
                          )}
                          sx={{ mb: 2 }}
                          onChange={(e: any) => {
                            field.onChange(e);
                            handleDataChange('name', e.target.value);
                          }}
                        />
                      )}
                    />
                    <Controller
                      name="description"
                      control={control}
                      render={({ field }) => (
                        <InputWithLabel
                          {...field}
                          multiline
                          fullWidth
                          label={t('Description')}
                          size="medium"
                          placeholder={t(
                            'Please enter your search scenario description',
                          )}
                          sx={{
                            mb: 2,
                            '& .MuiInputBase-inputMultiline': {
                              padding: 0,
                            },
                          }}
                          onChange={(e: any) => {
                            field.onChange(e);
                            handleDataChange('description', e.target.value);
                          }}
                        />
                      )}
                    />
                    {scenario?.id && (
                      <>
                        <InputWithLabel
                          label={t('Last Used Date')}
                          InputProps={{
                            readOnly: true,
                          }}
                          sx={{ mb: 2 }}
                          {...formRegister('last_used_at')}
                        />

                        <Box
                          display="flex"
                          alignItems="flex-end"
                          gap={2}
                          sx={{ mb: 2 }}
                        >
                          <Box flex={1}>
                            <Typography
                              fontSize={14}
                              fontWeight={700}
                              color="text.primary"
                              mb={0.5}
                            >
                              {t('Latest Version')}
                            </Typography>
                            <Box
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              height={40}
                              border="1px solid #000"
                              borderRadius="8px"
                              bgcolor="#fff"
                            >
                              <Typography
                                fontSize={18}
                                fontWeight={700}
                                color="text.disabled"
                              >
                                {scenario.ltst_ver_id}
                              </Typography>
                            </Box>
                          </Box>

                          <Box flex={1}>
                            <Typography
                              fontSize={14}
                              fontWeight={700}
                              color="text.primary"
                              mb={0.5}
                            >
                              {t('Deploy Version')}
                            </Typography>
                            <Box
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              height={40}
                              border="1px solid #000"
                              borderRadius="8px"
                              bgcolor="#fff"
                            >
                              <Typography
                                fontSize={18}
                                fontWeight={700}
                                color="text.disabled"
                              >
                                {scenario.depn_ver_id}
                              </Typography>
                            </Box>
                          </Box>

                          {scenario.ltst_ver_id && (
                            <Button
                              variant="contained"
                              onClick={() =>
                                handleVersionViewScenario(scenario)
                              }
                              sx={{
                                minWidth: 40,
                                height: 32,
                                mb: 0.25,
                              }}
                            >
                              <BuildIcon />
                            </Button>
                          )}
                        </Box>
                      </>
                    )}
                  </Box>
                </Box>

                {/* 하단 날짜 및 SAVE 버튼 영역 */}
                <Box
                  display={'flex'}
                  justifyContent={'space-between'}
                  alignItems={'center'}
                  p={2}
                  borderTop={1}
                  borderColor={COLORS.blueGrey[100]}
                  sx={{
                    backgroundColor: COLORS.blueGrey[50],
                  }}
                >
                  {/* 좌측 날짜 */}
                  <Typography variant="caption" color="text.secondary">
                    {format(new Date(), 'yyyy-MM-dd HH:mm:ss')}
                  </Typography>

                  {/* 우측 버튼 그룹 */}
                  <Box display="flex" gap={1}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSaveScenario}
                    >
                      {t('SAVE')}
                    </Button>

                    <Button
                      type="button"
                      variant="contained"
                      color="inherit"
                      onClick={() => {
                        setMode(null);
                        setSelectedScenario(false);
                      }}
                    >
                      {t('CLOSE')}
                    </Button>
                  </Box>
                </Box>
              </form>
            </Dialog>
            {/* // 2. 편집 화면 영역 끝 */}
          </Box>
        </Box>
      </Box>
      {/* // List와 Editor를 감싸는 수평 Flex 컨테이너 끝 */}
    </Box>
  );
};

export default ScenarioList;
