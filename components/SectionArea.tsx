import { Box, BoxProps } from '@mui/material';
import { ReactNode } from 'react';

interface SectionAreaProps extends BoxProps {
  children?: ReactNode;
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
      borderColor={{ borderColor: 'grey.200' }}
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