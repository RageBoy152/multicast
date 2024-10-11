const { contextBridge, ipcRenderer } = require('electron');



contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, data) => { ipcRenderer.send(channel, data) },
  receive: (channel, cb) => { ipcRenderer.on(channel, (event, ...args) => cb(...args)) },
  invoke: (channel) => ipcRenderer.invoke(channel)
})