import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
} from 'react';
import { ICellEditorParams } from 'ag-grid-community';
import {
  Box,
  Paper,
  Chip,
  List,
  ListItemButton,
  Typography,
} from '@mui/material';

import { ActiveChip } from './StatusChip';

const ActiveEditor = forwardRef<unknown, ICellEditorParams>((props, ref) => {
  const [value, setValue] = useState<string>(props.value);
  const valueRef = useRef<string>(props.value);

  const options: string[] = ['Y', 'N'];
  const width = props.column.getActualWidth();

  useImperativeHandle(
    ref,
    () => ({
      getValue: () => {
        return valueRef.current;
      },
      isPopup: () => true,
    }),
    [],
  );

  const handleSelect = (option: string) => {
    // 1. Force update the cell value via Grid API
    try {
      if (props.node && props.node.setDataValue) {
        props.node.setDataValue(props.column, option);
      }
    } catch (e) {
      console.error('setDataValue failed', e);
    }

    // 2. Update internal state
    valueRef.current = option;
    setValue(option);

    // 3. CANCEL editing.
    setTimeout(() => {
      if (props.api) {
        props.api.stopEditing(true);
      }
    }, 0);
  };

  const renderChip = (
    active: string, // Updated type to string
  ) => <ActiveChip active={active} />;

  return (
    <Paper
      elevation={6}
      sx={{
        width,
        overflow: 'hidden',
        borderRadius: '0',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          height: props.node?.rowHeight || 40,
          px: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          border: '2px solid',
          borderColor: 'primary.main',
        }}
      >
        {renderChip(value)}
        <Typography fontSize={10} color="text.secondary">
          ▲
        </Typography>
      </Box>

      {/* Options */}
      <List disablePadding>
        {options.map((option) => (
          <ListItemButton
            key={String(option)}
            onClick={() => handleSelect(option)}
            sx={{
              py: 0.5,
              px: 1,
            }}
          >
            {renderChip(option)}
          </ListItemButton>
        ))}
      </List>
    </Paper>
  );
});

ActiveEditor.displayName = 'ActiveEditor';

export default ActiveEditor;
