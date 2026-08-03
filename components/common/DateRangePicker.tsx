'use client';

import React, { useState } from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { Box, Popover, InputAdornment } from '@mui/material';
import { CalendarToday as CalendarIcon } from '@mui/icons-material';
import {
  format,
  isWithinInterval,
  isSameDay,
  isBefore,
  getDay,
} from 'date-fns';
import { styled } from '@mui/material/styles';

import InputWithLabel from '@/components/common/Input';
import { COLORS } from '@/lib/constants/color';

const CustomPickersDay = styled(PickersDay, {
  shouldForwardProp: (prop) =>
    ![
      'dayIsBetween',
      'isFirstDay',
      'isLastDay',
      'isStartOfWeek',
      'isEndOfWeek',
    ].includes(prop as string),
})<
  PickersDayProps & {
    dayIsBetween: boolean;
    isFirstDay: boolean;
    isLastDay: boolean;
    isStartOfWeek: boolean;
    isEndOfWeek: boolean;
  }
>(
  ({
    theme,
    dayIsBetween,
    isFirstDay,
    isLastDay,
    isStartOfWeek,
    isEndOfWeek,
  }) => ({
    width: '32px',
    height: '32px',
    fontSize: '13px',
    margin: 0,
    position: 'relative',

    // Background for days in range
    ...(dayIsBetween &&
      !isFirstDay &&
      !isLastDay && {
        backgroundColor: '#5E5ADB14',
        borderRadius: 0,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          // backgroundColor: '#5E5ADB14',
          zIndex: -1,
        },
      }),

    // Round left side if start of week or first day
    ...(dayIsBetween &&
      (isStartOfWeek || isFirstDay) && {
        borderTopLeftRadius: '50%',
        borderBottomLeftRadius: '50%',
        '&::before': {
          borderTopLeftRadius: '50%',
          borderBottomLeftRadius: '50%',
        },
      }),

    // Round right side if end of week or last day
    ...(dayIsBetween &&
      (isEndOfWeek || isLastDay) && {
        borderTopRightRadius: '50%',
        borderBottomRightRadius: '50%',
        '&::before': {
          borderTopRightRadius: '50%',
          borderBottomRightRadius: '50%',
        },
      }),

    // Style for start date
    ...(isFirstDay && {
      backgroundColor: COLORS.primary.main,
      color: COLORS.primary.contrastText,
      borderRadius: '50%',
      zIndex: 2,
      '&:hover, &:focus': {
        backgroundColor: COLORS.primary.dark,
      },
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: '50%',
        width: '50%',
        height: '100%',
        backgroundColor: '#5E5ADB14',
        zIndex: -1,
      },
    }),

    // Style for end date
    ...(isLastDay && {
      backgroundColor: COLORS.primary.main,
      color: COLORS.primary.contrastText,
      borderRadius: '50%',
      zIndex: 2,
      '&:hover, &:focus': {
        backgroundColor: COLORS.primary.dark,
      },
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        width: '50%',
        height: '100%',
        backgroundColor: '#5E5ADB14',
        zIndex: -1,
      },
    }),
  }),
);

interface DateRangePickerProps {
  label?: string;
  value: { start: Date | null; end: Date | null };
  onChange: (range: { start: Date | null; end: Date | null }) => void;
  placeholder?: string;
}

export default function DateRangePicker({
  label = 'Default Label',
  value,
  onChange,
  placeholder = 'YYYY-MM-DD ~ YYYY-MM-DD',
}: DateRangePickerProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) =>
    setAnchorEl(event.currentTarget);

  // hanle close popover later
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleDateChange = (
    newDate: Date | null,
    selectionState?: 'partial' | 'finish' | 'shallow',
    selectedView?: 'day' | 'month' | 'year',
  ) => {
    if (!newDate) return;

    // Ignore year/month selection so we don't select a default day when changing year/month view
    if (
      selectionState === 'partial' ||
      selectedView === 'year' ||
      selectedView === 'month'
    ) {
      return;
    }

    // If no start date yet, or both dates are already set → start a fresh selection
    if (!value.start || (value.start && value.end)) {
      onChange({ start: newDate, end: null });
      return;
    }

    // A start date exists but no end date: determine from/to based on order
    if (isBefore(newDate, value.start)) {
      // Selected date is earlier → swap: new date becomes start, old start becomes end
      onChange({ start: newDate, end: value.start });
    } else {
      // Selected date is same day or later → normal order
      onChange({ start: value.start, end: newDate });
    }
    handleClose();
  };

  const renderDay = (props: PickersDayProps) => {
    const { day } = props;
    const isFirstDay = value.start ? isSameDay(day, value.start) : false;
    const isLastDay = value.end ? isSameDay(day, value.end) : false;
    const dayIsBetween =
      value.start && value.end
        ? isWithinInterval(day, { start: value.start, end: value.end })
        : false;

    const dayOfWeek = getDay(day);
    const isStartOfWeek = dayOfWeek === 0;
    const isEndOfWeek = dayOfWeek === 6;

    return (
      <CustomPickersDay
        {...props}
        dayIsBetween={dayIsBetween}
        isFirstDay={isFirstDay}
        isLastDay={isLastDay}
        isStartOfWeek={isStartOfWeek}
        isEndOfWeek={isEndOfWeek}
      />
    );
  };

  const displayValue = value.start
    ? `${format(value.start, 'yyyy-MM-dd')}${value.end ? ` ~ ${format(value.end, 'yyyy-MM-dd')}` : ' ~ '}`
    : '';

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
          onClick={handleClick}
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
            value={value.start}
            onChange={handleDateChange}
            slots={{ day: renderDay }}
            sx={{
              width: '232px',
              height: '280px',
              '& .MuiDateCalendar-root': {
                width: '232px',
                height: '280px',
              },
              '& .MuiPickersCalendarHeader-root': {
                // Top header
                paddingLeft: '14px',
                paddingRight: '0px',
                marginTop: '7px',
                marginBottom: '-5px',
              },
              '& .MuiPickersCalendarHeader-labelContainer': {
                // Month year label
                fontSize: '13px',
              },
              '& .MuiDayCalendar-weekDayLabel': {
                // Weekday labels
                margin: '-7px 1px',
                width: '28px',
              },
              '& .MuiDayCalendar-weekContainer': {
                margin: '3px 10px',
              },
              '& .MuiYearCalendar-root': {
                // Year view
                columnGap: '0px',
                width: '233px',
              },
            }}
          />
        </Popover>
      </Box>
    </LocalizationProvider>
  );
}
