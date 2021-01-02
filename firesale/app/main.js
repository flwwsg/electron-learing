const {app, BrowserWindow, dialog} = require('electron');
const fs = require('fs');

// 所有窗口
const windows = new Set();

// 所有打开的文件
const openFiles = new Map();

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
        },
    });
    // 是否编辑, isDocumentEdited 只是macos中有效,所以添加此字段支持windows
    newWindow.isEdited = false;
    newWindow.loadURL(`file://${__dirname}/index.html`);
    newWindow.once('ready-to-show', () => {
        newWindow.show();
    });

    // 准备关闭
    newWindow.on('close', (event) => {
        // console.debug(newWindow.isDocumentEdited());
        if(newWindow.isEdited) {
            event.preventDefault();

            dialog.showMessageBox(newWindow, {
                type: 'warning',
                title: '退出前保存文件？',
                message: '现在退出会丢失所有未保存的改动',
                buttons: [
                    '退出，不保存',
                    '取消'
                ],
                cancelId: 1,
                defaultId: 0,
            }).then(result => {
                if (result.response === 0) {
                    // 用户希望不保存，直接退出
                    newWindow.destroy();
                }
            });
        }
    });


    // 已关闭
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
        if(!files.canceled) {
            openFile(targetWindow, files.filePaths[0])
        }
    })
}

const openFile = (targetWindow, file) => {
    const content = fs.readFileSync(file).toString();
    // 添加最近打开文件列表
    app.addRecentDocument(file);
    targetWindow.setRepresentedFilename(file);
    targetWindow.webContents.send('file-opened', file, content);
    // TODO watching file
}

// 保存 md 文件
const saveMarkdown = exports.saveMarkdown = (targetWindow, file, content) => {
    if (!file) {
        dialog.showSaveDialog(targetWindow, {
            title: 'Save Markdown',
            defaultPath: app.getPath('documents'),
            filters: [
                {
                    name: 'Markdown Files',
                    extensions: ['md', 'markdown']
                }
            ]
        }).then(saved => {
            if(!saved.canceled) {
                fs.writeFileSync(saved.filePath, content);
                openFile(targetWindow, saved.filePath);
            }
        })
    } else {
        fs.writeFileSync(file, content);
        openFile(targetWindow, file);
    }
}

const saveHtml = exports.saveHtml = (targetWindow, content) => {
    dialog.showSaveDialog(targetWindow, {
        title: 'Save HTML',
        defaultPath: app.getPath('documents'),
        filters: [
            {
                name: 'HTML Files',
                extensions: ['html', 'htm']
            }
        ]
    }).then(file => {
        if (!file.canceled) {
            fs.writeFileSync(file.filePath, content);
        }
    })
}

// TODO monitor file