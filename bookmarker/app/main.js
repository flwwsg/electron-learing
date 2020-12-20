// node process, does not have DOM, and can not render a UI.
// main process 用于跟系统交互，调用底层，管理 render process，不过并不渲染 HTML、CSS
const { app, BrowserWindow } = require('electron');

// 创建 render process
let mainWindow = null;
app.on('ready', () => {
   console.log('hello electron');
   mainWindow = new BrowserWindow();
   mainWindow.webContents.loadFile(`${__dirname}/index.html`).then(r => {console.log('html loaded:', r)}).catch(r => {console.log('get error', r)});
});