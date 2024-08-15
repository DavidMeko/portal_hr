import React from 'react';
import { Box, CircularProgress, Typography, Stepper, Step, StepLabel } from '@mui/material';

const LoadingOverlay = ({ currentStep, totalRows, tableName }) => {
  const steps = [
    'Reading Excel file',
    `Excel data loaded, rows: ${totalRows}`,
    `Determined table name: ${tableName}`,
    'Updating database',
    'Database update completed'
  ];

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
      }}
    >
      <CircularProgress size={60} thickness={4} />
      <Box sx={{ width: '80%', maxWidth: 600, mt: 4 }}>
        <Stepper activeStep={currentStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>
                <Typography variant="body2" color="white">
                  {index === 1 && totalRows ? label.replace('${totalRows}', totalRows) : 
                   index === 2 && tableName ? label.replace('${tableName}', tableName) : 
                   label}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>
    </Box>
  );
};

export default LoadingOverlay;