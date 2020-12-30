const {app, BrowserWindow, dialog} = require('electron');
const fs = require('fs');

let mainWindow = null;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        // 阻止白屏
        show: false,
        webPreferences: {
            nodeIntegration: true,
            // 版本10以后，默认关闭
            enableRemoteModule: true,
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


const getFileFromUser = exports.getFileFromUser = () => {
    dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
            {
                name: 'Markdown Files',
                extensions: ['md', 'markdown']
            },
            {
                name: 'Text Files',
                extensions: ['txt']
            },
        ]
    }).then(files => {
        // console.log('files ======', files);
        // files = {canceled: 是否取消, filePaths: 文件列表 }
        openFile(files.filePaths[0])
    })
}

const openFile = (file) => {
    const content = fs.readFileSync(file).toString();
    mainWindow.webContents.send('file-opened', file, content);
}