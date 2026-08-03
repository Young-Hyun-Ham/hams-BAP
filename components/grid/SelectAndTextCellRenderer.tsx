import {
  Autocomplete,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { ICellRendererParams } from 'ag-grid-community';
import { SearchIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

// import { useDebounce } from './hooks/useDebounce';
// import useCommonUdcs from './hooks/useBizDatas';

export default function SelectAndTextCellRenderer(params: ICellRendererParams) {
  const { value, node, api, data } = params;
  const recommends = data?.recommends || [];
  const currentText = value?.text || '';
  const [inputValue, setInputValue] = useState('');
  const { t } = useTranslation();

  const handleChangeSelect = async (event: any) => {
    const newId = event.target.value;
    const oldValue = data._custom_headword;
    const oldSynmId = data._custom_rcmd_id;

    const matched = recommends.find(
      (s: any) => (s.dmn_tag_id || s.dmn_tag_nm) === newId,
    );
    const newValue = matched?.dmn_tag_nm || '';

    data._custom_headword = newValue;
    data._custom_rcmd_id = matched?.dmn_tag_id || newValue;

    if (data.std_appl_yn === 'Y' && oldValue !== newValue) {
      const confirmed = await params.context?.onRegisterChange(
        data,
        false,
        params,
      );
      if (confirmed === false) {
        // Revert UI by not updating data
        data._custom_headword = oldValue;
        data._custom_rcmd_id = oldSynmId;
        return;
      }
    }

    api.refreshCells({ rowNodes: [node], force: true });
  };

  if (data?.cand_tp_cd === 'STD') {
    return (
      <Stack
        sx={{
          p: 1,
          height: '100%',
          width: '100%',
          minWidth: 320,
          justifyContent: 'center',
        }}
      >
        <TextField
          size="small"
          fullWidth
          multiline
          minRows={2}
          value={data?._custom_headword || ''}
          onChange={(e) => {
            const newValue = e.target.value;
            if (
              data.std_appl_yn === 'Y' &&
              data._custom_headword !== newValue
            ) {
              params.context?.onRegisterChange(data, false);
            }
            data._custom_headword = newValue;
            api.refreshCells({ rowNodes: [node], force: true });
          }}
          sx={{
            '& .MuiInputBase-root': {
              padding: '6px 8px',
              fontSize: '13px',
            },
          }}
        />
      </Stack>
    );
  }

  return (
    <Stack
      spacing={1}
      sx={{
        p: 1,
        height: '100%',
        width: '100%',
        minWidth: 320,
        justifyContent: 'center',
      }}
    >
      <Select
        size="small"
        value={data._custom_rcmd_id || currentText}
        onChange={handleChangeSelect}
        fullWidth
        displayEmpty
        sx={{
          height: '28px',
          fontSize: '13px',
          '& .MuiSelect-select': {
            py: 0.5,
          },
        }}
      >
        {recommends.map((s: any, idx: number) => (
          <MenuItem
            key={`${s.dmn_tag_nm}-${idx}`}
            value={s.dmn_tag_id || s.dmn_tag_nm}
          >
            {s.dmn_tag_nm}
          </MenuItem>
        ))}
      </Select>

      <Autocomplete
        size="small"
        fullWidth
        freeSolo
        ListboxProps={{
          sx: {
            '& .MuiAutocomplete-option': {
              fontSize: '13px',
              minHeight: 'auto',
              padding: '4px 10px',
            },
          },
        }}
        options={[]}
        getOptionLabel={(option: any) => {
          if (typeof option === 'string') return option;
          return option.value02 || '';
        }}
        inputValue={inputValue}
        onInputChange={(_event, newInputValue, reason) => {
          if (reason === 'reset' || reason === 'clear') {
            setInputValue('');
          } else {
            setInputValue(newInputValue);
          }
        }}
        onChange={async (_event, newValue: any) => {
          if (newValue) {
            const selectedText =
              typeof newValue === 'string'
                ? newValue
                : newValue.value02 || newValue.value01;
            const selectedId =
              typeof newValue === 'string' ? '' : newValue.value01 || '';

            const oldValue = data._custom_headword;
            const oldSynmId = data._custom_rcmd_id;

            if (selectedText) {
              if (!data.recommends) {
                data.recommends = [];
              }
              const exists = data.recommends.find(
                (s: any) => s.dmn_tag_nm === selectedText,
              );
              if (!exists) {
                data.recommends.push({
                  dmn_tag_nm: selectedText,
                  sim_sc: 0,
                  dmn_tag_id: selectedId,
                });
              }

              data._custom_headword = selectedText;
              data._custom_rcmd_id = selectedId;

              if (data.std_appl_yn === 'Y' && oldValue !== selectedText) {
                const confirmed = await params.context?.onRegisterChange(
                  data,
                  false,
                  params,
                );
                if (confirmed === false) {
                  data._custom_headword = oldValue;
                  data._custom_rcmd_id = oldSynmId;
                  return;
                }
              }

              setInputValue('');
              api.refreshCells({ rowNodes: [node], force: true });
            }
          }
        }}
        // loading={isLoading}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder={t('Search')}
            sx={{
              '& .MuiInputBase-root': {
                height: '28px',
                fontSize: '13px',
                paddingTop: '0 !important',
                paddingBottom: '0 !important',
              },
            }}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  <InputAdornment position="start" sx={{ pl: 1, mr: -0.5 }}>
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                  {params.InputProps.startAdornment}
                </>
              ),
              endAdornment: (
                <>
                  {/* {isLoading ? (
                    <CircularProgress color="inherit" size={16} />
                  ) : null} */}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
      />
    </Stack>
  );
}
