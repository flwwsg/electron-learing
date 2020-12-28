// node process, does not have DOM, and can not render a UI.
// main process 用于跟系统交互，调用底层，管理 render process，不过并不渲染 HTML、CSS
const { app, BrowserWindow } = require('electron');

// 创建 render process
let mainWindow = null;
app.on('ready', () => {
   console.log('hello electron');
   mainWindow = new BrowserWindow({
      webPreferences: {
         // electron 版本 5 以后默认为 false，改为true 可以使用 nodejs 函数
         nodeIntegration: true,
      }
   });
   // debugger, 或者按 ctrl+shift+i
   // mainWindow.webContents.openDevTools();
   mainWindow.webContents.loadURL(`file://${__dirname}/index.html`).then(r => {console.log('html loaded:', r)}).catch(r => {console.log('get error', r)});
});