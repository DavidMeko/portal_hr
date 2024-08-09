const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const { 
  createDbConnection, 
  searchSAPEmployees, 
  searchHilanEmployees, 
  getEmployeeDetails, 
  loadExcelAndUpdateDatabase, 
  getHilanAttendance, 
  generateReport, 
  exportReport, 
  compareEmployeeData,
  getUniqueColumnValues, 
  getHilanInterfaceData,
  updateHilanInterfaceRecord
} = require('./electron/database');
const { initAuth, createUser, loginUser, verifyToken, invalidateToken, getUsers, updateUser, deleteUser } = require('./electron/auth');


let mainWindow;
let db;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      worldSafeExecuteJavaScript: true,
      sandbox: true
    },
    frame: false
  });

  mainWindow.loadFile('index.html');

  // Always open DevTools
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  // Log when the window content has finished loading
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Window content loaded');
  });
    autoUpdater.checkForUpdatesAndNotify();
}

autoUpdater.on('update-available', () => {
  mainWindow.webContents.send('update_available');
});

autoUpdater.on('update-downloaded', () => {
  mainWindow.webContents.send('update_downloaded');
});

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});

app.on('ready', async () => {
  try {
    console.log('App is ready, initializing...');
    db = await createDbConnection();
    console.log('Database connection successful');
    await initAuth(db);
    createWindow();
  } catch (error) {
    console.error('Error during app initialization:', error);
  }
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});

// IPC handlers
ipcMain.on('minimize-window', () => mainWindow.minimize());
ipcMain.on('maximize-window', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});
ipcMain.on('close-window', () => mainWindow.close());

ipcMain.handle('search-sap-employees', async (event, query, page, pageSize, sortField, sortOrder) => {
  try {
    return await searchSAPEmployees(query, page, pageSize, sortField, sortOrder);
  } catch (error) {
    console.error('Error searching SAP employees:', error);
    return { employees: [], total: 0, page: 1, pageSize, totalPages: 0 };
  }
});

ipcMain.handle('search-hilan-employees', async (event, query, page, pageSize, sortField, sortOrder) => {
    console.log('Received search-hilan-employees request:', { query, page, pageSize, sortField, sortOrder });  // Add this line
    try {
        const result = await searchHilanEmployees(query, page, pageSize, sortField, sortOrder);
        console.log('Search result:', result);  // Add this line
        return result;
    } catch (error) {
        console.error('Error searching Hilan employees:', error);
        return { employees: [], total: 0, page: 1, pageSize, totalPages: 0 };
    }
});

ipcMain.handle('get-employee-details', async (event, system, employeeId) => {
  try {
    return await getEmployeeDetails(system, employeeId);
  } catch (error) {
    console.error('Error getting employee details:', error);
    return null;
  }
});

ipcMain.handle('load-excel-file', async (event, filePath) => {
  try {
    console.log('Importing Excel file:', filePath);
    const result = await loadExcelAndUpdateDatabase(filePath, (progress) => {
      // Send progress updates to the renderer process
      event.sender.send('excel-import-progress', progress);
    });
    console.log('Import result:', result);
    return result;
  } catch (error) {
    console.error('Error loading Excel file:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('get-hilan-attendance', async (event, employeeId, startDate, endDate) => {
  try {
      console.log('Main process: Fetching Hilan attendance for:', employeeId, startDate, endDate);
      const result = await getHilanAttendance(employeeId, startDate, endDate);
      console.log('Main process: Fetched attendance result:', result);
      return result;  // This should already have the { success: true, attendance: [...] } structure
  } catch (error) {
      console.error('Main process: Error getting Hilan attendance:', error);
      return { success: false, error: error.message };
  }
});

ipcMain.handle('generate-report', async (event, { dataSource, filters, columns }) => {
  try {
    const data = await generateReport(dataSource, filters, columns);
    return { success: true, data };
  } catch (error) {
    console.error('Error generating report:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-report', async (event, { data, format, suggestedName }) => {
  try {
    const { filePath } = await dialog.showSaveDialog({
      defaultPath: suggestedName,
      filters: [
        { name: format.toUpperCase(), extensions: [format] }
      ]
    });

    if (filePath) {
      await exportReport(data, format, filePath);
      return { success: true, filePath };
    } else {
      return { success: false, error: 'Export cancelled' };
    }
  } catch (error) {
    console.error('Error exporting report:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-unique-column-values', async (event, { dataSource, column }) => {
  try {
    const values = await getUniqueColumnValues(dataSource, column);
    return { success: true, values };
  } catch (error) {
    console.error('Error getting unique column values:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('login-user', async (event, { username, password }) => {
  try {
    console.log(`Login attempt for user: ${username}`);
    const result = await loginUser(username, password);
    console.log('Login successful');
    return { success: true, ...result };
  } catch (error) {
    console.error('Error logging in user:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('verify-token', async (event, token) => {
  const user = verifyToken(token);
  return user ? { success: true, user } : { success: false };
});

ipcMain.handle('logout-user', async (event, token) => {
  invalidateToken(token);
  return { success: true };
});

ipcMain.handle('get-users', async () => {
  try {
    const users = await getUsers();
    return { success: true, users };
  } catch (error) {
    console.error('Error getting users:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('create-user', async (event, { username, password, role }) => {
  try {
    const userId = await createUser(username, password, role);
    return { success: true, userId };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-user', async (event, { id, username, role }) => {
  try {
    const changes = await updateUser(id, username, role);
    return { success: true, changes };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-user', async (event, id) => {
  try {
    const changes = await deleteUser(id);
    return { success: true, changes };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('dialog:openFile', async (event, options) => {
  return await dialog.showOpenDialog(options);
});

ipcMain.handle('load-hilan-interface-excel', async (event, filePath) => {
  try {
    const data = await loadHilanInterfaceExcel(filePath);
    await updateHilanInterfaceDatabase(data);
    return { success: true, message: 'Hilan Interface data loaded successfully' };
  } catch (error) {
    console.error('Error loading Hilan Interface Excel:', error);
    return { success: false, message: error.message };
  }
});

ipcMain.handle('get-hilan-interface-data', async (event, options) => {
  try {
    const result = await getHilanInterfaceData(options);
    return result;
  } catch (error) {
    console.error('Error getting Hilan Interface data:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-hilan-interface-record', async (event, id, updatedData) => {
  try {
    const result = await updateHilanInterfaceRecord(id, updatedData);
    return { success: true, changes: result.changes };
  } catch (error) {
    console.error('Error updating Hilan Interface record:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('compare-employee-data', async (event, employeeId, currentSystem, otherSystem) => {
  try {
    const data = await compareEmployeeData(employeeId, currentSystem, otherSystem);
    return { success: true, data };
  } catch (error) {
    console.error('Error comparing employee data:', error);
    return { success: false, error: error.message };
  }
});