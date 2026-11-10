'use strict';
const {contextBridge, ipcRenderer} = require('electron');
contextBridge.exposeInMainWorld('overniaDesktop', {
  getAppInfo: () => ipcRenderer.invoke('overnia:get-app-info')
});
