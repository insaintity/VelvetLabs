/* eslint-disable @typescript-eslint/no-require-imports */
const { contextBridge, ipcRenderer } = require("electron");

const allowedActions = new Set(["minimize", "maximize", "close"]);

contextBridge.exposeInMainWorld("velvetDesktop", {
  windowAction(action) {
    if (allowedActions.has(action)) ipcRenderer.send("velvet:window-action", action);
  }
});
