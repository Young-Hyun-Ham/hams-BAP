import { Box, BoxProps } from '@mui/material';
import { ReactNode } from 'react';
import { COLORS } from '@/lib/constants/color';

import { SxProps, Theme } from '@mui/material';

interface SectionAreaProps extends BoxProps {
  children?: ReactNode;
  sx?: SxProps<Theme>;
}

const SectionArea = ({ children, sx, ...props }: SectionAreaProps) => {
  return (
    <Box
      component="section"
      flex={1}
      display="flex"
      flexDirection="column"
      border={1}
      width={'100%'}
      height={'100%'}
      borderColor={COLORS.blueGrey[100]}
      borderRadius={2}
      gap={1}
      p={1.5}
      sx={sx}
      {...props}
    >
      {children}
    </Box>
  );
};

export default SectionArea;
