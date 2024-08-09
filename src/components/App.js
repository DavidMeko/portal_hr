import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
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

const App = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken(token);
    }
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
      const result = await window.electron.dialog.openFile({
        properties: ['openFile'],
        filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }]
      });

      if (result.canceled) {
        return;
      }

      const uploadResult = await window.electron.ipcRenderer.invoke('load-excel-file', result.filePaths[0]);
      if (uploadResult.success) {
        console.log(uploadResult.message);
      } else {
        console.error(uploadResult.message);
      }
    } catch (error) {
      console.error('Error in file upload:', error);
    }
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
              </Routes>
            </Box>
          </Box>
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;