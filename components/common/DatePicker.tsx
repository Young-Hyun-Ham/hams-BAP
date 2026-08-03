'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { Box, Popover, InputAdornment } from '@mui/material';
import { CalendarToday as CalendarIcon } from '@mui/icons-material';
import { format } from 'date-fns';

import InputWithLabel from '@/components/common/Input';

interface DatePickerProps {
  label?: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
}

const DEFAULT_FORMAT = 'yyyy-MM-dd';

export default function DatePicker({
  label = 'Date',
  value,
  onChange,
  placeholder = 'Select date',
}: DatePickerProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [dateFormat, setDateFormat] = useState(DEFAULT_FORMAT);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedFormat = localStorage.getItem('date_format');
      if (storedFormat) {
        setDateFormat(storedFormat);
      }
    }
  }, []);

  const handleOpen = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDateChange = (newDate: Date | null) => {
    onChange(newDate);
    handleClose();
  };

  const displayValue = useMemo(() => {
    if (!value) return '';
    try {
      return format(value, dateFormat);
    } catch {
      return format(value, DEFAULT_FORMAT);
    }
  }, [value, dateFormat]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <InputWithLabel
          label={label}
          size="small"
          value={displayValue}
          placeholder={placeholder}
          slotProps={{
            input: {
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <CalendarIcon fontSize="small" sx={{ cursor: 'pointer' }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            width: '186px',
            '& .MuiInputBase-root': {
              paddingRight: '8px',
            },
            '& .MuiOutlinedInput-input': {
              padding: '0px 0px 0px 8px !important',
            },
            '& .MuiInputAdornment-root': {
              margin: 0,
            },
          }}
          onClick={handleOpen}
        />

        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
          slotProps={{
            paper: {
              sx: {
                boxShadow: '0 2px 3px rgba(0, 0, 0, 0.2)',
                borderRadius: '5px',
                overflow: 'hidden',
                marginTop: '1px',
              },
            },
          }}
        >
          <DateCalendar
            value={value}
            onChange={handleDateChange}
            sx={{
              width: '232px',
              height: '280px',
              '& .MuiPickersCalendarHeader-root': {
                paddingLeft: '14px',
                paddingRight: '0px',
                marginTop: '7px',
                marginBottom: '-5px',
              },
              '& .MuiPickersCalendarHeader-labelContainer': {
                fontSize: '13px',
              },
              '& .MuiDayCalendar-weekDayLabel': {
                margin: '-7px 1px',
                width: '28px',
              },
              '& .MuiDayCalendar-weekContainer': {
                margin: '3px 10px',
              },
              '& .MuiPickersDay-root': {
                height: '28px',
              },
            }}
          />
        </Popover>
      </Box>
    </LocalizationProvider>
  );
}
