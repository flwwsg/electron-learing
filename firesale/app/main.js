const { app, BrowserWindow } = require('electron');

let mainWindow = null;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        // 阻止白屏
        show: false,
        webPreferences: {
            nodeIntegration: true,
        }
    });

    mainWindow.loadURL(`file://${__dirname}/index.html`);
    // 启动后显示
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
})