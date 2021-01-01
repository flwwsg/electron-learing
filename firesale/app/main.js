const {app, BrowserWindow, dialog} = require('electron');
const fs = require('fs');

const windows = new Set();

app.on('ready', () => {
    createWindow();
});

app.on('window-all-closed', () => {
    if(process.platform === 'darwin') {
        return false;
    }
    // 其它情况退出
    process.exit(0);
});

// 任务栏点击时
app.on('activate', (event, hasVisibleWindows) => {
    if(!hasVisibleWindows) {
        createWindow();
    }
})

// 统一创建窗口
const createWindow = exports.createWindow = () => {
    // 让新建的窗口不重合
    let x, y;
    const currentWindow = BrowserWindow.getFocusedWindow();
    if (currentWindow) {
        const [currentWindowX, currentWindowY] = currentWindow.getPosition();
        x = currentWindowX + Math.floor(Math.random() * 50) + 10;
        y = currentWindowY + Math.floor(Math.random() * 50) + 10;
        console.log(x, y);
    }
    let newWindow = new BrowserWindow({
        x, y,
        // 阻止白屏
        show: false,
        webPreferences: {
            // 使用 node 环境
            nodeIntegration: true,
            // 允许 remote 模块，node 10 以后，默认关闭
            enableRemoteModule: true,
        }
    });
    newWindow.loadURL(`file://${__dirname}/index.html`);
    newWindow.once('ready-to-show', () => {
        newWindow.show();
    });
    newWindow.on('closed', () => {
        windows.delete(newWindow);
        newWindow = null;
    });

    windows.add(newWindow);
    return newWindow;
}


const getFileFromUser = exports.getFileFromUser = (targetWindow) => {
    dialog.showOpenDialog(targetWindow, {
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
    }).then((files) => {
        // console.log('files ======', files);
        // files = {canceled: 是否取消, filePaths: 文件列表 }
        openFile(targetWindow, files.filePaths[0])
    })
}

const openFile = (targetWindow, file) => {
    const content = fs.readFileSync(file).toString();
    targetWindow.webContents.send('file-opened', file, content);
}