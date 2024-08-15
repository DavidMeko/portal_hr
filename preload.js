const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, func) => {
      const validChannels = ['import-progress-update'];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    removeListener: (channel, func) => {
      const validChannels = ['import-progress-update'];
      if (validChannels.includes(channel)) {
        ipcRenderer.removeListener(channel, func);
      }
    },
    invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  },
  auth: {
    login: (credentials) => ipcRenderer.invoke('login-user', credentials),
    verifyToken: (token) => ipcRenderer.invoke('verify-token', token),
    logout: (token) => ipcRenderer.invoke('logout-user', token),
    getUsers: () => ipcRenderer.invoke('get-users'),
    createUser: (userData) => ipcRenderer.invoke('create-user', userData),
    updateUser: (userData) => ipcRenderer.invoke('update-user', userData),
    deleteUser: (id) => ipcRenderer.invoke('delete-user', id),
  },
  dialog: {
    openFile: (options) => ipcRenderer.invoke('dialog:openFile', options),
  },
  hilanAttendance: {
    get: (employeeId, startDate, endDate) => ipcRenderer.invoke('get-hilan-attendance', employeeId, startDate, endDate),
  },
  report: {
    generate: (params) => ipcRenderer.invoke('generate-report', params),
    export: (params) => ipcRenderer.invoke('export-report', params),
    getUniqueColumnValues: (params) => ipcRenderer.invoke('get-unique-column-values', params),
  },
  hilanPermissions: {
    add: (data) => ipcRenderer.invoke('add-hilan-permission', data),
    get: (employeeId) => ipcRenderer.invoke('get-hilan-employee-permissions', employeeId),
    update: (permission) => ipcRenderer.invoke('update-hilan-permission', permission),
    delete: (permissionId) => ipcRenderer.invoke('delete-hilan-permission', permissionId),
  },
  sapTransactions: {
    get: (employeeId) => ipcRenderer.invoke('get-transactions', employeeId),
    add: (data) => ipcRenderer.invoke('add-transaction', data),
    update: (transaction) => ipcRenderer.invoke('update-transaction', transaction),
    delete: (transactionId) => ipcRenderer.invoke('delete-transaction', transactionId),
  },
  knowledgeBase: {
    getFileStructure: () => ipcRenderer.invoke('get-file-structure'),
    getFileContent: (path) => ipcRenderer.invoke('get-file-content', path),
    addItem: (data) => ipcRenderer.invoke('add-item', data),
    deleteItem: (path) => ipcRenderer.invoke('delete-item', path),
    renameItem: (oldPath, newName) => ipcRenderer.invoke('rename-item', oldPath, newName),
  },
});