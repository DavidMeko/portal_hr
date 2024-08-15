import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  FormControlLabel, 
  Switch, 
  Button, 
  CircularProgress, 
  Snackbar, 
  Alert, 
  Box, 
  LinearProgress 
} from '@mui/material';

const Settings = ({ darkMode, onThemeChange, user, onLogout }) => {
    const [loading, setLoading] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    useEffect(() => {
        const handleImportProgress = (progress) => {
            setImportProgress(progress * 100);
        };

        window.electron.ipcRenderer.on('import-progress-update', handleImportProgress);

        return () => {
            window.electron.ipcRenderer.removeListener('import-progress-update', handleImportProgress);
        };
    }, []);

    const handleFileUpload = async () => {
        try {
            const result = await window.electron.dialog.openFile({
                properties: ['openFile'],
                filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xls'] }]
            });

            if (result.canceled) {
                return;
            }

            setLoading(true);
            setImportProgress(0);
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
            setImportProgress(0);
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

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>App Settings</Typography>
            <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Account: {user.username}</Typography>
                <Button variant="outlined" color="secondary" onClick={onLogout} sx={{ mt: 1 }}>
                    Logout
                </Button>
            </Box>
            <FormControlLabel
                control={
                    <Switch
                        checked={darkMode}
                        onChange={onThemeChange}
                        name="darkMode"
                        color="primary"
                    />
                }
                label="Dark Mode"
            />
            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleFileUpload}
                    disabled={loading}
                    sx={{ position: 'relative' }}
                >
                    {loading ? 'Importing...' : 'Import Data from Excel'}
                    {loading && (
                        <CircularProgress
                            size={24}
                            sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                marginTop: '-12px',
                                marginLeft: '-12px',
                            }}
                        />
                    )}
                </Button>
                {loading && (
                    <Box sx={{ width: '100%', mt: 2 }}>
                        <LinearProgress variant="determinate" value={importProgress} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {Math.round(importProgress)}% Complete
                        </Typography>
                    </Box>
                )}
            </Box>
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
    );
};

export default Settings;