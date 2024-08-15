const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs').promises;
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
  getTransactionsForEmployee,
  addTransactionForEmployee,
  updateTransaction,
  deleteTransaction,
  updateHilanInterfaceRecord,
  addHilanPermission,
  addHilanSystem,
  getHilanEmployeePermissions,
  deleteHilanPermission,
  updateHilanPermission,
} = require('./electron/database');
const { initAuth, createUser, loginUser, verifyToken, invalidateToken, getUsers, updateUser, deleteUser } = require('./electron/auth');
const ExcelJS = require('exceljs');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const mime = require('mime-types');
const log = require('electron-log');

let mainWindow;
let db;


log.transports.file.level = 'info';
log.transports.console.level = 'info';

app.on('ready', () => {
  log.info('App is ready');
});

app.on('window-all-closed', () => {
  log.info('All windows closed');
});

app.on('will-quit', () => {
  log.info('App will quit');
});

// New function to get the root path for the knowledge base
const getKnowledgeBasePath = () => {
  if (app.isPackaged) {
    return '\\\\ism\\hr\\IT\\portalHR\\KnowledgeBase';
  } else {
    return '\\\\ism\\hr\\IT\\portalHR\\KnowledgeBase';;
  }
};

const ensureKnowledgeBaseDir = async () => {
  const dir = getKnowledgeBasePath();
  try {
    if (app.isPackaged) {
      // For production, just check if the directory exists
      await fs.access(dir);
    } else {
      // For development, create the directory if it doesn't exist
      await fs.mkdir(dir, { recursive: true });
    }
    log.info('Knowledge Base directory exists:', dir);
  } catch (error) {
    log.error('Error accessing knowledge base directory:', error);
  }
};

async function getFileStructure(dir) {
  const items = await fs.readdir(dir, { withFileTypes: true });
  const structure = [];

  for (const item of items) {
    const itemPath = path.join(dir, item.name);
    const relativePath = path.relative(getKnowledgeBasePath(), itemPath);
    if (item.isDirectory()) {
      structure.push({
        name: item.name,
        type: 'folder',
        path: relativePath,
        children: await getFileStructure(itemPath)
      });
    } else {
      structure.push({
        name: item.name,
        type: 'file',
        path: relativePath
      });
    }
  }

  return structure;
}

function createWindow() {
  log.info('Creating main window');
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: false
    },
    frame: false
  });

  log.info('Loading index.html');
  mainWindow.loadFile('index.html');

  mainWindow.webContents.on('did-finish-load', () => {
    log.info('Main window finished loading');
  });

  mainWindow.on('closed', function () {
    log.info('Main window closed');
    mainWindow = null;
  });
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
    log.info('App is ready, initializing...');
    db = await createDbConnection();
    log.info('Database connection successful');
    await initAuth(db);
    
    const knowledgeBasePath = getKnowledgeBasePath();
    await ensureKnowledgeBaseDir();
    log.info('Knowledge Base directory ensured at:', knowledgeBasePath);

    createWindow();
  } catch (error) {
    log.error('Error during app initialization:', error);
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
    const result = await loadExcelAndUpdateDatabase(filePath, (progress) => {
      event.sender.send('import-progress-update', progress);
    });
    return result;
  } catch (error) {
    console.error('Error in file upload:', error);
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

ipcMain.on('import-progress', (event, progress) => {
  mainWindow.webContents.send('import-progress-update', progress);
});

ipcMain.handle('get-transactions', async (event, employeeId) => {
  try {
    const transactions = await getTransactionsForEmployee(employeeId);
    return { success: true, transactions };
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('add-transaction', async (event, { employeeId, transactionCode }) => {
  try {
    const result = await addTransactionForEmployee(employeeId, transactionCode);
    return { success: true, id: result };
  } catch (error) {
    console.error('Error adding transaction:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('update-transaction', async (event, transaction) => {
  try {
    await updateTransaction(transaction);
    return { success: true };
  } catch (error) {
    console.error('Error updating transaction:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-transaction', async (event, transactionId) => {
  try {
    await deleteTransaction(transactionId);
    return { success: true };
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-file-structure', async () => {
  try {
    const knowledgeBasePath = getKnowledgeBasePath();
    console.log('Getting file structure for Knowledge Base:', knowledgeBasePath);
    const structure = await getFileStructure(knowledgeBasePath);
    console.log('File structure:', JSON.stringify(structure, null, 2));
    return { success: true, structure };
  } catch (error) {
    console.error('Error getting file structure:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('add-item', async (event, { parentPath, name, isFolder }) => {
  try {
    console.log('Adding item:', { parentPath, name, isFolder });
    const knowledgeBasePath = getKnowledgeBasePath();
    const fullParentPath = path.join(knowledgeBasePath, parentPath);
    const newPath = path.join(fullParentPath, name);
    console.log('Full new path:', newPath);

    if (isFolder) {
      await fs.mkdir(newPath, { recursive: true });
      console.log('Folder created:', newPath);
    } else {
      await fs.writeFile(newPath, '');
      console.log('File created:', newPath);
    }
    return { success: true };
  } catch (error) {
    console.error('Error adding item:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('rename-item', async (event, oldPath, newName) => {
  try {
    const knowledgeBasePath = getKnowledgeBasePath();
    const fullOldPath = path.join(knowledgeBasePath, oldPath);
    const dirName = path.dirname(fullOldPath);
    const fullNewPath = path.join(dirName, newName);
    console.log('Renaming item:', { fullOldPath, fullNewPath });
    await fs.rename(fullOldPath, fullNewPath);
    return { success: true };
  } catch (error) {
    console.error('Error renaming item:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-item', async (event, itemPath) => {
  try {
    const knowledgeBasePath = getKnowledgeBasePath();
    const fullPath = path.join(knowledgeBasePath, itemPath);
    console.log('Deleting item:', fullPath);
    const stats = await fs.stat(fullPath);
    if (stats.isDirectory()) {
      await fs.rmdir(fullPath, { recursive: true });
      console.log('Folder deleted:', fullPath);
    } else {
      await fs.unlink(fullPath);
      console.log('File deleted:', fullPath);
    }
    return { success: true };
  } catch (error) {
    console.error('Error deleting item:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-file-content', async (event, filePath) => {
  try {
    const knowledgeBasePath = getKnowledgeBasePath();
    const fullPath = path.join(knowledgeBasePath, filePath);
    const ext = path.extname(fullPath).toLowerCase();
    
    let content;
    
    switch (ext) {
      case '.xlsx':
      case '.xls':
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(fullPath);
        content = [];
        workbook.worksheets.forEach(sheet => {
          const sheetData = [];
          sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
            sheetData.push(row.values.slice(1)); // Remove the first undefined element
          });
          content.push({ name: sheet.name, data: sheetData });
        });
        break;
      
      case '.pdf':
      case '.jpg':
      case '.jpeg':
      case '.png':
      case '.gif':
        const imageBuffer = await fs.readFile(fullPath);
        const mimeType = mime.lookup(ext) || 'application/octet-stream';
        content = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
        break;
      
      default:
        content = await fs.readFile(fullPath, 'utf-8');
    }
    
    return { success: true, content, fileType: ext.slice(1) };
  } catch (error) {
    console.error('Error reading file:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('add-hilan-permission', async (event, { employeeId, permissionName }) => {
    try {
        const result = await addHilanPermission(employeeId, permissionName);
        return { success: true, id: result };
    } catch (error) {
        console.error('Error adding Hilan permission:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('add-hilan-system', async (event, { permissionId, systemName, permissionType, population }) => {
    try {
        const result = await addHilanSystem(permissionId, systemName, permissionType, population);
        return { success: true, id: result };
    } catch (error) {
        console.error('Error adding Hilan system:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-hilan-employee-permissions', async (event, employeeId) => {
    try {
        const permissions = await getHilanEmployeePermissions(employeeId);
        return { success: true, permissions };
    } catch (error) {
        console.error('Error getting Hilan employee permissions:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('update-hilan-permission', async (event, permission) => {
    try {
        const result = await updateHilanPermission(permission);
        return { success: true, id: result };
    } catch (error) {
        console.error('Error updating Hilan permission:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('delete-hilan-permission', async (event, permissionId) => {
    try {
        const result = await deleteHilanPermission(permissionId);
        return { success: true, result };
    } catch (error) {
        console.error('Error deleting Hilan permission:', error);
        return { success: false, error: error.message };
    }
});