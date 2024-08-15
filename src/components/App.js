import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Snackbar, Alert } from '@mui/material';
import { HashRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import TitleBar from './TitleBar';
import Home from './Home';
import ReportGenerator from './ReportGenerator';
import SAP from './SAP';
import Hilan from './Hilan';
import HilanInterface from './HilanInterface';
import Settings from './Settings';
import AdminPanel from './AdminPanel';
import Login from './Login';
import ErrorBoundary from './ErrorBoundary';
import LoadingOverlay from './LoadingOverlay';
import KnowledgeBase from './KnowledgeBase';

const App = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [tableName, setTableName] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken(token);
    }

    const handleImportProgress = (_, { step, message, totalRows, tableName }) => {
      switch (step) {
        case 'start':
          setLoadingStep(0);
          break;
        case 'dataLoaded':
          setLoadingStep(1);
          setTotalRows(totalRows);
          break;
        case 'tableNameDetermined':
          setLoadingStep(2);
          setTableName(tableName);
          break;
        case 'updatingDatabase':
          setLoadingStep(3);
          break;
        case 'complete':
          setLoadingStep(4);
          break;
        default:
          console.warn('Unknown import progress step:', step);
      }
    };

    window.electron.ipcRenderer.on('import-progress-update', handleImportProgress);

    return () => {
      window.electron.ipcRenderer.removeListener('import-progress-update', handleImportProgress);
    };
  }, []);

  const verifyToken = async (token) => {
    try {
      const result = await window.electron.auth.verifyToken(token);
      if (result.success) {
        setUser(result.user);
      } else {
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('Error verifying token:', error);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('token', userData.token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleImportData = async () => {
    try {
      setLoading(true);
      setLoadingStep(0);
      setTotalRows(0);
      setTableName('');

      const result = await window.electron.dialog.openFile({
        properties: ['openFile'],
        filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }]
      });

      if (result.canceled) {
        setLoading(false);
        return;
      }

      const uploadResult = await window.electron.ipcRenderer.invoke('load-excel-file', result.filePaths[0]);
      if (uploadResult.success) {
        showSnackbar(uploadResult.message, 'success');
      } else {
        showSnackbar(uploadResult.message, 'error');
      }
    } catch (error) {
      console.error('Error in file upload:', error);
      showSnackbar('Error loading Excel file', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      text: {
        primary: darkMode ? '#e5e5e2' : '#29261b',
      },
      background: {
        default: darkMode ? '#2c2b28' : '#f0eee5',
        paper: darkMode ? '#23231f' : '#eae8db',
      },
      primary: {
        main: '#bd5c39',
      },
      secondary: {
        main: darkMode ? '#23231f' : '#eae8db',
      },
    },
  });

  return (
    <ErrorBoundary>
      <Router>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
            {user && (
              <TitleBar
                onMinimize={() => window.electron.ipcRenderer.send('minimize-window')}
                onMaximize={() => window.electron.ipcRenderer.send('maximize-window')}
                onClose={() => window.electron.ipcRenderer.send('close-window')}
                username={user.username}
                userRole={user.role}
                darkMode={darkMode}
                onToggleDarkMode={handleToggleDarkMode}
                onImportData={handleImportData}
              />
            )}
            <Box component="main" sx={{ flexGrow: 1, overflow: 'auto', width: '100%' }}>
              <Routes>
                <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" replace />} />
                <Route path="/" element={user ? <Home /> : <Navigate to="/login" replace />} />
                <Route path="/report" element={user ? <ReportGenerator /> : <Navigate to="/login" replace />} />
                <Route path="/sap" element={user ? <SAP /> : <Navigate to="/login" replace />} />
                <Route path="/hilan" element={user ? <Hilan /> : <Navigate to="/login" replace />} />
                <Route path="/hilan-interface" element={user ? <HilanInterface /> : <Navigate to="/login" replace />} />
                <Route path="/admin" element={user && user.role === 'admin' ? <AdminPanel /> : <Navigate to="/" replace />} />
                <Route path="/settings" element={user ? <Settings darkMode={darkMode} onThemeChange={handleToggleDarkMode} user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
                <Route path="/knowledge-base" element={user ? <KnowledgeBase /> : <Navigate to="/login" replace />} />
                
              </Routes>
            </Box>
            {loading && (
              <LoadingOverlay
                currentStep={loadingStep}
                totalRows={totalRows}
                tableName={tableName}
              />
            )}
            <Snackbar 
              open={snackbar.open} 
              autoHideDuration={6000} 
              onClose={handleCloseSnackbar}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
              <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                {snackbar.message}
              </Alert>
            </Snackbar>
          </Box>
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;

// <Route path="/knowledge-base" element={user ? <KnowledgeBase /> : <Navigate to="/login" replace />} />