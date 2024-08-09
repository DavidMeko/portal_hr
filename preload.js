const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
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
});