'use strict';

const { ipcRenderer } = require('electron');

// DOM 内置的通知事件
ipcRenderer.on('show-notification', (event, title, body, onClick = () => {}) => {
    const myNotify = new Notification(title, { body });
    myNotify.onclick = onClick;
})
