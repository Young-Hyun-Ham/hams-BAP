'use client';
import '@/lib/grid/ag-grid';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Modal, Typography } from '@mui/material';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { getScenarioDeployHistory } from '../../services/backendService';
import { useBuilderStore } from '../../store';

import { AppLoadingOverlay } from '@/components/common/AppLoadingOverlay';
import SectionArea from '@/components/common/SectionArea';
import { defaultGridOptions } from '@/lib/grid/defaultGridOptions';
import { useModal } from '@/providers/ModalProvider';
import GridPagination from '@/components/GridPagination/GridPagination';

type DeployHistoryListModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectDeployHistory: (router: any) => void;
};

const DeployHistoryListModal = ({
  isOpen,
  onClose,
  onSelectDeployHistory,
}: DeployHistoryListModalProps) => {
  const [rowData, setRowData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const { showAlert} = useModal();
  const { backend, scenario } = useBuilderStore() as any;
  const [paginationModel, setPaginationModel] = useState({
    page: 1,
    pageSize: 50,
  });
  const prevPaginationRef = useRef(paginationModel);

  const currentValues: any = {};

  const fetchDeployHistory = async (searchParams: any) => {
    setLoading(true);
    try {
      const payload = {
        ...searchParams,
        scenario_id: scenario?.id || '',
        page: paginationModel.page,
        pageSize: paginationModel.pageSize,
      };
      const res: any = await getScenarioDeployHistory(backend, payload);
      const items = Array.isArray(res) ? res : (res?.items ?? []);
      setRowData(items);
      setTotalCount(
        Array.isArray(res) ? res.length : (res?.totalCount ?? items.length),
      );
    } catch (error) {
      showAlert(t('Failed to load Deploy History list.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !scenario?.id) return;
    void Promise.resolve().then(() => fetchDeployHistory(currentValues));
  }, [isOpen, scenario?.id]);

  useEffect(() => {
    if (!isOpen || !scenario?.id) return;
    if (prevPaginationRef.current === paginationModel) {
      return;
    }
    prevPaginationRef.current = paginationModel;
    fetchDeployHistory(currentValues);
  }, [paginationModel]);

  const handleSelectDeployHistory = (event: { data: any }) => {
    onSelectDeployHistory(event.data);
    onClose();
  };

  const onPaginationChange = (page: number, pageSize: number) => {
    setPaginationModel((prev) => {
      const adjustedPage = page < 1 ? 1 : page;
      if (prev.page === adjustedPage && prev.pageSize === pageSize) {
        return prev;
      }
      return {
        page: prev.pageSize !== pageSize ? 1 : adjustedPage,
        pageSize: pageSize,
      };
    });
  };

  const columnDefs: ColDef[] = useMemo(
    () => [
      {
        headerName: t('Deploy Date'),
        field: 'depn_dt',
        width: 200,
      },
      { headerName: t('Deploy version'), field: 'ver_id' },
      { headerName: t('Deploy User'), field: 'depn_usr_id' },
      { headerName: t('Memo'), field: 'depn_memo', flex: 1 },
    ],
    [t],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <Modal open={isOpen} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: 1400,
          height: '60vh',
          bgcolor: 'background.paper',
          boxShadow: 24,
          borderRadius: 2,
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        {loading && <AppLoadingOverlay loading={loading} />}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6" fontWeight="bold">
            {t('Deploy History List')}
          </Typography>
          <Button variant="outlined" size="small" onClick={onClose}>
            {t('Close')}
          </Button>
        </Box>
        <SectionArea>
          <Typography variant="subtitle1" component="h1" fontWeight="bold">
            {t('Deploy History List')}
            <Box component="span">({totalCount})</Box>
          </Typography>

          <Box
            sx={{
              p: 0,
              width: '100%',
              height: '83%',
            }}
          >
            <AgGridReact
              {...defaultGridOptions}
              enableRowPinning={false}
              context={{ highlightReadOnly: false }}
              rowData={rowData}
              columnDefs={columnDefs}
              noRowsOverlayComponentParams={{
                message: t('No Router data'),
              }}
              onRowDoubleClicked={handleSelectDeployHistory}
            />

            <GridPagination
              currentPage={paginationModel.page}
              totalCount={totalCount}
              pageSize={paginationModel.pageSize}
              pageSizeOptions={[50, 100, 200, 500]}
              onPaginationChange={onPaginationChange}
            />
          </Box>
        </SectionArea>
      </Box>
    </Modal>
  );
};

export default DeployHistoryListModal;
