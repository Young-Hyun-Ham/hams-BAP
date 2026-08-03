'use client';

import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import BuildIcon from '@mui/icons-material/Build';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { format } from 'date-fns';

import InputWithLabel from '@/components/common/Input';
import { COLORS } from '@/lib/constants/color';
import { formatDateTime } from '../../utils/util';

type ScenarioEditModalProps = {
  open: boolean;
  scenario?: any;
  onClose: () => void;
  onSave: (scenario: any) => Promise<void> | void;
  onVersionView?: (scenario?: any) => void;
};

export default function ScenarioEditModal({
  open,
  scenario,
  onClose,
  onSave,
  onVersionView,
}: ScenarioEditModalProps) {
  const { t } = useTranslation();
  const { control, handleSubmit, reset, register } = useForm<any>({
    defaultValues: {
      id: '',
      name: '',
      description: '',
      created_at: '',
      updated_at: '',
      last_used_at: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    // console.log('===================> ', scenario);
    reset({
      id: scenario?.id ?? '',
      name: scenario?.name ?? '',
      description: scenario?.description ?? '',
      created_at: formatDateTime(scenario?.created_at) ?? '',
      updated_at: formatDateTime(scenario?.updated_at) ?? '',
      last_used_at:
        formatDateTime(scenario?.last_used_at ?? scenario?.updated_at) ?? '',
    });
  }, [open, reset, scenario]);

  const submit = async (values: any) => {
    await onSave({
      ...scenario,
      ...values,
      id: scenario?.id,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 1.25,
          pr: 1,
        }}
      >
        <Typography fontSize={14} fontWeight={500} color="text.primary">
          {scenario?.id ? t('Edit Data') : t('Add Data')}
        </Typography>
        <IconButton size="small" onClick={onClose} aria-label={t('CLOSE')}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        <Box flex={1} display="flex" flexDirection="column" gap={1}>
          <Box
            flex={1}
            border={2}
            borderColor="primary.main"
            borderRadius={2}
            display="flex"
            flexDirection="column"
            sx={{ minHeight: 0 }}
          >
            <form
              onSubmit={handleSubmit(submit)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                minHeight: 0,
              }}
            >
              <Box
                flex={1}
                display="flex"
                flexDirection="column"
                gap={2}
                p={2}
                sx={{
                  borderRadius: '8px 8px 0px 0px',
                  background: 'linear-gradient(180deg, #FFF 0%, #F7F6FF 100%)',
                  overflow: 'auto',
                }}
              >
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <InputWithLabel
                      {...field}
                      fullWidth
                      disabled={scenario ? true : false}
                      label={`${t('Name')} *`}
                      size="medium"
                      placeholder={t('Please enter your search scenario name')}
                      sx={{ mb: 2 }}
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
                      {...register('last_used_at')}
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
                          onClick={() => onVersionView?.(scenario)}
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

              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                p={2}
                borderTop={1}
                borderColor={COLORS.blueGrey[100]}
                sx={{
                  borderRadius: '0px 0px 8px 8px',
                  backgroundColor: COLORS.blueGrey[50],
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {format(new Date(), 'yyyy-MM-dd HH:mm:ss')}
                </Typography>

                <Box display="flex" gap={1}>
                  <Button variant="contained" color="primary" type="submit">
                    {t('SAVE')}
                  </Button>

                  <Button
                    type="button"
                    variant="contained"
                    color="inherit"
                    onClick={onClose}
                  >
                    {t('CLOSE')}
                  </Button>
                </Box>
              </Box>
            </form>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
