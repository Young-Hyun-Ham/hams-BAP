'use client';

import React from 'react';
import {
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
} from '@mui/material';
import type { ICellRendererParams } from 'ag-grid-community';

// Interface mở rộng để nhận tham số values
interface RadioRendererParams extends ICellRendererParams {
  values?: string[];
}

export const RadioGroupRenderer = (params: RadioRendererParams) => {
  const options = params.values || [];

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = event.target.value;
    params.node.setDataValue(params.colDef?.field || '', newVal);
  };

  return (
    <FormControl
      component="fieldset"
      fullWidth
      sx={{ height: '100%', justifyContent: 'center' }}
    >
      <RadioGroup
        row
        value={params.value}
        onChange={handleChange}
        sx={{ flexWrap: 'nowrap' }}
      >
        {options.map((opt) => (
          <FormControlLabel
            key={opt}
            value={opt}
            control={<Radio size="small" sx={{ padding: '4px' }} />}
            label={opt}
            slotProps={{ typography: { variant: 'caption' } }}
            sx={{ mr: 1, ml: 0 }}
          />
        ))}
      </RadioGroup>
    </FormControl>
  );
};
