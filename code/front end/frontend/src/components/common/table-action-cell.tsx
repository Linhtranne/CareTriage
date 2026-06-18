import React from 'react';
import { Box, BoxProps } from '@mui/material';

interface TableActionCellProps extends BoxProps {
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
}

/**
 * A standardized container for table action buttons to prevent stretching,
 * wrapping, and alignment issues in DataGrid or standard tables.
 * 
 * Enforces Phase 7 requirements: flex, nowrap, correct gap and alignment.
 */
export default function TableActionCell({ 
  align = 'right', 
  children, 
  sx, 
  ...props 
}: Readonly<TableActionCellProps>) {
  let justifyContent = 'flex-start';
  if (align === 'right') {
    justifyContent = 'flex-end';
  } else if (align === 'center') {
    justifyContent = 'center';
  }
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent,
        gap: 1, // 8px
        width: '100%',
        minWidth: 'max-content',
        flexWrap: 'nowrap',
        ...sx
      }}
      {...props}
    >
      {children}
    </Box>
  );
}
