import React from 'react';
import { Typography, Paper } from '@mui/material';

const Home = () => {
  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <Typography variant="h4" gutterBottom>
        Welcome to HR Portal
      </Typography>
      <Typography variant="body1">
        This is the home page. You can add more content here as needed.
      </Typography>
    </Paper>
  );
};

export default Home;