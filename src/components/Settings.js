import React, { useState, useEffect } from 'react';
import { Typography, FormControlLabel, Switch, Button, CircularProgress, Snackbar, Alert, Box, LinearProgress } from '@mui/material';

const Settings = ({ darkMode, onThemeChange, user, onLogout }) => {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    useEffect(() => {
        const handleProgress = (event, value) => {
            setProgress(value * 100);
        };

        window.electron.ipcRenderer.on('excel-import-progress', handleProgress);

        return () => {
            window.electron.ipcRenderer.removeListener('excel-import-progress', handleProgress);
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
            setProgress(0);
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
            setProgress(0);
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
            <Box sx={{ mt: 2 }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleFileUpload}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    {loading ? 'Importing...' : 'Import Data from Excel'}
                </Button>
                {loading && (
                    <Box sx={{ width: '100%', mt: 2 }}>
                        <LinearProgress variant="determinate" value={progress} />
                        <Typography variant="body2" color="text.secondary" align="center">
                            {Math.round(progress)}%
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