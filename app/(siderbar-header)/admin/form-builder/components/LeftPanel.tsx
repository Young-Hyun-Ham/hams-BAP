import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { ArrowDropDown as ChevronDownIcon } from '@mui/icons-material';

import { ElementType } from '../type';
import {
  FORM_ELEMENT_REGISTRY,
  FORM_ELEMENT_TYPES,
} from '../stores/elementRegistry';

type LeftPanelProps = {
  addComponent: (type: ElementType) => void;
  elementTypes: ElementType[];
  loading?: boolean;
  error?: string | null;
};

function LeftPanel({
  addComponent,
  elementTypes,
  loading = false,
  error = null,
}: LeftPanelProps) {
  return (
    <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
        }}
      >
        <Typography variant="subtitle2" fontWeight={700}>
          Basic
        </Typography>
        <ChevronDownIcon fontSize="small" />
      </Box>

      {loading ? (
        <Typography variant="body2" color="text.secondary">
          Loading element types...
        </Typography>
      ) : null}

      {error ? (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      ) : null}

      <List
        disablePadding
        sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}
      >
        {elementTypes.map((type) => {
          const comp = FORM_ELEMENT_REGISTRY[type];

          return (
            <ListItemButton
              key={type}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData(
                  'application/x-form-component',
                  type,
                );
                event.dataTransfer.effectAllowed = 'copy';
              }}
              onClick={() => addComponent(type)}
              sx={{
                border: 1,
                borderColor: 'primary.light',
                borderRadius: 1,
                color: 'primary.main',
                py: 0.75,
                '&:hover': { bgcolor: 'primary.50' },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                {comp.icon}
              </ListItemIcon>
              <ListItemText
                primary={comp.label}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}

export default LeftPanel;
