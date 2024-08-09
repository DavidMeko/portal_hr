import React from 'react';
import { Typography, Paper, Button } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Paper style={{ padding: '20px', margin: '20px' }}>
          <Typography variant="h5" gutterBottom>Something went wrong.</Typography>
          <Typography variant="body1">
            {this.state.error && this.state.error.toString()}
          </Typography>
          {this.state.errorInfo && (
            <Typography variant="body2" component="pre" style={{ whiteSpace: 'pre-wrap' }}>
              {this.state.errorInfo.componentStack || 'No stack trace available'}
            </Typography>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={() => window.location.reload()}
            style={{ marginTop: '20px' }}
          >
            Reload Page
          </Button>
        </Paper>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;