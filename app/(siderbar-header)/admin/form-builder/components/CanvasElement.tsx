import {
  Typography,
  Box,
  TextField,
  Paper,
  Chip,
  Stack,
  FormControlLabel,
  Checkbox,
  FormControl,
  Select,
  MenuItem,
  Divider,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';

import { FormElement } from '../type';

function ElementPreview({ element }: { element: FormElement }) {
  const normalizeOption = (
    option: string | { value: string; label: string },
  ) => (typeof option === 'string' ? { value: option, label: option } : option);

  switch (element.type) {
    case 'input':
      return (
        <TextField
          fullWidth
          size="small"
          disabled
          placeholder={element.placeholder}
          value={element.defaultValue}
        />
      );
    case 'date':
      return (
        <TextField
          fullWidth
          size="small"
          type="date"
          disabled
          value={element.defaultValue}
        />
      );
    case 'checkbox':
      return (
        <Stack spacing={0.5}>
          {element.options.map((item) => {
            const option = normalizeOption(item);

            return (
              <FormControlLabel
                key={option.value}
                control={
                  <Checkbox
                    size="small"
                    disabled
                    checked={element.defaultValue.includes(option.value)}
                  />
                }
                label={<Typography variant="body2">{option.label}</Typography>}
              />
            );
          })}
        </Stack>
      );
    case 'dropbox':
      return (
        <FormControl fullWidth size="small" disabled>
          <Select value={element.defaultValue} displayEmpty>
            <MenuItem value="">
              <em>Select option</em>
            </MenuItem>
            {element.options.map((item) => {
              const option = normalizeOption(item);
              return (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      );
    case 'search':
      return (
        <Box
          sx={{
            bgcolor: '#ddd',
            borderRadius: 1,
            px: 2.5,
            py: 2,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="subtitle1"
            fontWeight={700}
            sx={{ color: '#2d4558', mb: 1 }}
          >
            {element.label || '(No label)'}
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <TextField
              fullWidth
              size="small"
              disabled
              placeholder={element.placeholder}
              value={element.defaultValue}
              sx={{
                '& .MuiInputBase-root': {
                  bgcolor: 'background.paper',
                  borderRadius: 0.75,
                  fontSize: 22,
                },
                '& .MuiInputBase-input': {
                  py: 1,
                },
              }}
            />
            <SearchIcon
              sx={{
                color: '#1f7fd1',
                fontSize: 36,
                filter: 'drop-shadow(3px 3px 0 #7b4f96)',
              }}
            />
          </Box>

          <Typography
            variant="body2"
            fontStyle="italic"
            sx={{ mt: 0.75, color: '#006cff', fontSize: 16 }}
          >
            Result Slot: {`{${element.resultSlot || '(No result slot)'}}`}
          </Typography>
        </Box>
      );
    case 'grid':
      return (
        <>
          {element.optionsSlot ? (
            // 바인딩 된 데이터
            <>
              <Box sx={{ mb: 1, color: 'text.secondary' }}>
                Bound to : {`{${element.optionsSlot || '(No data slot)'}}`}
              </Box>

              <Divider />

              <Box sx={{ mb: 1, color: 'text.secondary' }}>
                Columns Count : {element.displayKeys.length}
                {element.displayKeys.length ? (
                  <>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${element.displayKeys.length}, minmax(0, 1fr))`,
                        gap: 0.75,
                      }}
                    >
                      {element.displayKeys.map((item, index) => (
                        <Box
                          key={index}
                          sx={{
                            minHeight: 34,
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 0.75,
                            px: 1,
                            display: 'flex',
                            alignItems: 'center',
                            color: 'text.primary',
                            bgcolor: 'grey.50',
                            fontSize: 13,
                          }}
                        >
                          {item.label}
                        </Box>
                      ))}
                      {element.displayKeys.map((item, index) => (
                        <Box
                          key={index}
                          sx={{
                            minHeight: 34,
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 0.75,
                            px: 1,
                            display: 'flex',
                            alignItems: 'center',
                            color: 'text.disabled',
                            bgcolor: 'grey.50',
                            fontSize: 13,
                          }}
                        >
                          {/* {item.label} ({item.key}) */}
                          {`${element.optionsSlot}[0].${item.key}`}
                        </Box>
                      ))}
                    </Box>
                  </>
                ) : (
                  '(No display value)'
                )}
              </Box>
            </>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: `repeat(${element.columns}, minmax(0, 1fr))`,
                gap: 0.75,
              }}
            >
              {element.data.map((cell, index) => (
                <Box
                  key={index}
                  sx={{
                    minHeight: 34,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 0.75,
                    px: 1,
                    display: 'flex',
                    alignItems: 'center',
                    color: cell ? 'text.primary' : 'text.disabled',
                    bgcolor: 'grey.50',
                    fontSize: 13,
                  }}
                >
                  {cell || `Cell ${index + 1}`}
                </Box>
              ))}
            </Box>
          )}
        </>
      );
    default:
      return null;
  }
}

function CanvasElement({
  element,
  selected,
  onSelect,
}: {
  element: FormElement;
  selected: boolean;
  onSelect: (event: React.MouseEvent<HTMLDivElement>) => void;
}) {
  return (
    <Paper
      variant="outlined"
      onClick={onSelect}
      sx={{
        p: 1.5,
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.2s',
        borderWidth: 2,
        borderStyle: selected ? 'solid' : 'dashed',
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected ? 'primary.50' : 'background.paper',
        '&:hover': {
          borderColor: selected ? 'primary.main' : 'primary.light',
        },
      }}
    >
      <Chip
        label={element.type.toUpperCase()}
        size="small"
        sx={{
          position: 'absolute',
          top: -10,
          left: 10,
          height: 20,
          fontSize: 10,
          fontWeight: 700,
          bgcolor: 'background.paper',
          color: 'primary.main',
        }}
      />

      {element.type !== 'search' ? (
        <Typography variant="body2" fontWeight={600} sx={{ mb: 1, mt: 0.5 }}>
          {element.label || '(No label)'}
        </Typography>
      ) : null}
      <ElementPreview element={element} />
    </Paper>
  );
}

export default CanvasElement;
