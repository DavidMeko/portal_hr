import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton, 
  Box, 
  Menu, 
  MenuItem, 
  Switch, 
  FormControlLabel, 
  Dialog, 
  DialogContent 
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RemoveIcon from '@mui/icons-material/Remove';
import CropSquareIcon from '@mui/icons-material/CropSquare';
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminPanel from './AdminPanel';

const pages = [
  { path: '/', label: 'Home' }, 
  { path: '/report', label: 'Report Generator' },
  { path: '/sap', label: 'SAP' },
  { path: '/hilan', label: 'Hilan' },
  { path: '/hilan-interface', label: 'Hilan Interface' },
  { path: '/knowledge-base', label: 'Knowledge Base' },
];

const DraggableArea = ({ children }) => (
  <div style={{ 
    WebkitAppRegion: 'drag',
    cursor: 'move',
    flexGrow: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    {children}
  </div>
);

const TitleBar = ({ 
  onMinimize, 
  onMaximize, 
  onClose, 
  darkMode, 
  onToggleDarkMode, 
  username, 
  onImportData, 
  userRole 
}) => {
  const [pageAnchorEl, setPageAnchorEl] = useState(null);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentPage = pages.find(page => page.path === location.pathname) || pages[0];

  const handlePageClick = (event) => {
    setPageAnchorEl(event.currentTarget);
  };

  const handlePageClose = () => {
    setPageAnchorEl(null);
  };

  const handleSettingsClick = (event) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  const handlePageChange = (path) => {
    navigate(path);
    handlePageClose();
  };

  const handleOpenAdminPanel = () => {
    setAdminPanelOpen(true);
    handleSettingsClose();
  };

  return (
    <>
      <AppBar position="static" color="default" elevation={0} sx={{ WebkitUserSelect: 'none', bgcolor: 'background.paper' }}>
        <Toolbar variant="dense" sx={{ minHeight: '32px', padding: 0 }}>
          <IconButton size="small" onClick={handleSettingsClick} sx={{ ml: 1, WebkitAppRegion: 'no-drag', color: 'text.primary' }}>
            <SettingsIcon />
          </IconButton>
          <DraggableArea>
            <Box 
              sx={{ 
                px: 2, 
                py: 0.5, 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center',
                WebkitAppRegion: 'no-drag',
                bgcolor: 'background.default',
                color: 'text.primary',
                borderRadius: 1,
              }}
              onClick={handlePageClick}
            >
              <Typography variant="subtitle1" component="div">
                {currentPage.label}
              </Typography>
              <ArrowDropDownIcon />
            </Box>
          </DraggableArea>
          <Box sx={{ display: 'flex', alignItems: 'center', WebkitAppRegion: 'no-drag' }}>
            <IconButton size="small" onClick={onMinimize} sx={{ color: 'text.primary' }}>
              <RemoveIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={onMaximize} sx={{ color: 'text.primary' }}>
              <CropSquareIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={onClose} sx={{ mr: 1, color: 'text.primary' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <Menu
        anchorEl={pageAnchorEl}
        open={Boolean(pageAnchorEl)}
        onClose={handlePageClose}
      >
        {pages.map((page) => (
          <MenuItem key={page.path} onClick={() => handlePageChange(page.path)}>
            {page.label}
          </MenuItem>
        ))}
      </Menu>
      <Menu
        anchorEl={settingsAnchorEl}
        open={Boolean(settingsAnchorEl)}
        onClose={handleSettingsClose}
      >
        <MenuItem disabled>{username}</MenuItem>
        <MenuItem>
          <FormControlLabel
            control={
              <Switch
                checked={darkMode}
                onChange={onToggleDarkMode}
                name="darkMode"
              />
            }
            label="Dark Mode"
          />
        </MenuItem>
        <MenuItem onClick={() => { onImportData(); handleSettingsClose(); }}>Import Data from Excel</MenuItem>
        {userRole === 'admin' && (
          <MenuItem onClick={handleOpenAdminPanel}>User Management</MenuItem>
        )}
      </Menu>
      <Dialog open={adminPanelOpen} onClose={() => setAdminPanelOpen(false)} maxWidth="md" fullWidth>
        <DialogContent>
          <AdminPanel />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TitleBar;