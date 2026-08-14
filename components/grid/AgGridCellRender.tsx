import { Box, Paper, Typography, Chip } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

import { CommonUdcOutput } from '@/lib/types/commonCode';
export interface CellRenderParams extends CommonUdcOutput {
  mode: 'view' | 'editor';
  displayName?: string;
  is_place_holder?: boolean | true;
  is_display_chip: boolean;
}
const AgGridCellRender = (props: CellRenderParams | any) => {
  const displayId = props.value03 || props.value01;
  const hasValue =
    Boolean(displayId && props.value02) || Boolean(props.displayName);

  /* ================= EDITOR MODE ================= */
  if (props.mode === 'editor') {
    return (
      <Paper
        elevation={0}
        sx={{
          height: '100%',
          border: '2px solid #5e35b1',
          backgroundColor: 'white',
          display: 'flex',
          alignItems: 'center',
          pl: 0.5, // 4px padding + 2px border = 6px visual offset (adjusted from 8px to fix alignment)
          pr: 0.5,
        }}
      >
        {!hasValue && (
          <AddIcon
            sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary', width: 30 }}
          />
        )}

        {hasValue ? (
          <>
            {props.is_display_chip ? (
              <Chip
                label={displayId}
                size="small"
                sx={{
                  mr: 1,
                  height: 22, // Match View mode
                  minWidth: 64, // Match View mode
                  bgcolor: '#eceff1',
                  fontSize: 12, // Match View mode
                  fontWeight: 500,
                }}
              />
            ) : (
              <></>
            )}
            <Typography
              variant="body2"
              sx={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {props.displayName ? props.displayName : props.value02}
            </Typography>
          </>
        ) : (
          <Typography variant="body1" color="text.secondary">
            Connecting
          </Typography>
        )}
      </Paper>
    );
  }

  /* ================= VIEW MODE ================= */
  return (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        px: 0.5,
        overflow: 'hidden',
      }}
    >
      {hasValue ? (
        <>
          {props.is_display_chip && (
            <Chip
              label={displayId}
              size="small"
              sx={{
                mr: 1,
                height: 22,
                minWidth: 64,
                bgcolor: '#eceff1',
                fontSize: 12,
                fontWeight: 500,
              }}
            />
          )}
          <Typography
            variant="body2"
            sx={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {props.displayName ? props.displayName : props.value02}
          </Typography>
        </>
      ) : props.is_place_holder ? (
        <>
          <AddIcon
            sx={{
              fontSize: 16,
              mr: 0.5,
              color: 'text.disabled',
              width: 30,
            }}
          />
          <Typography variant="body2" color="text.secondary">
            Connecting
          </Typography>
        </>
      ) : null}
    </Box>
  );
};

export default AgGridCellRender;
