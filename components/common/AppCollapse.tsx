import React, { useState } from 'react';
import {
  Box,
  Typography,
  Collapse,
  IconButton,
  SxProps,
  Theme,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

interface AppCollapseProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  sx?: SxProps<Theme>;
}

const AppCollapse: React.FC<AppCollapseProps> = ({
  title,
  children,
  defaultExpanded = true,
  sx,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Box sx={{ width: '100%', ...sx }}>
      <Box
        onClick={() => setIsExpanded(!isExpanded)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          mb: 1,
          userSelect: 'none',
        }}
      >
        <IconButton
          size="small"
          sx={{
            p: 0,
            mr: 0.5,
            color: 'black',
            transition: 'transform 0.2s',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          <PlayArrowIcon fontSize="small" />
        </IconButton>
        <Typography variant="subtitle2" fontWeight={700}>
          {title}
        </Typography>
      </Box>

      <Collapse in={isExpanded} timeout={200} unmountOnExit>
        {children}
      </Collapse>
    </Box>
  );
};

export default AppCollapse;
