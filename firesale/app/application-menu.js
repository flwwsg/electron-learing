const { app, dialog, Menu } = require('electron');
const mainProcess = require('./main');

const template = [
    {
        label: 'File',
        submenu: [
            {
                label: 'New File',
                accelerator: 'CommandOrControl+N',
                click() {
                    mainProcess.createWindow();
                }
            },
            {
                label: 'Open File',
                accelerator: 'CommandOrControl+O',
                click(item, focusedWindow) {
                    if(focusedWindow) {
                        return mainProcess.getFileFromUser(focusedWindow);
                    }
                    const newWindow = mainProcess.createWindow();

                    newWindow.on('show', () => {
                        mainProcess.getFileFromUser(newWindow);
                    });
                }
            },
            {
                label: 'Save File',
                accelerator: 'CommandOrControl+S',
                click(item, focusedWindow) {
                    if(!focusedWindow) {
                        return dialog.showErrorBox(
                            '无法保存、导出',
                            '不能保存、导出当前文档'
                        );
                    }
                    // 由renderer process 保存文档
                    focusedWindow.webContents.send('save-markdown');
                }
            },
            {
                label: 'Export HTML',
                accelerator: 'CommandOrControl+S',
                click(item, focusedWindow) {
                    if(!focusedWindow) {
                        return dialog.showErrorBox(
                            '无法保存、导出',
                            '不能保存、导出当前文档'
                        );
                    }
                    // 由renderer process 保存文档
                    focusedWindow.webContents.send('save-html');
                }
            },
        ]
    },
    {
        label: 'Edit',
        submenu: [
            {
                label: 'Undo',
                accelerator: 'CommandOrControl+Z',
                role: 'undo',
            },
            {
                label: 'Redo',
                accelerator: 'Shift+CommandOrControl+Z',
                role: 'redo',
            },
            {
                type: 'separator'
            },
            {
                label: 'Cut',
                accelerator: 'CommandOrControl+X',
                role: 'cut',
            },
            {
                label: 'Copy',
                accelerator: 'CommandOrControl+C',
                role: 'copy',
            },
            {
                label: 'Paste',
                accelerator: 'CommandOrControl+V',
                role: 'paste',
            },
            {
                label: 'Select All',
                accelerator: 'CommandOrControl+A',
                role: 'selectAll',
            },
            // save
            {
                label: 'Save',
                accelerator: 'CommandOrControl+S',
                role: 'save'
            }

        ]
    },
    {
        label: 'Window',
        submenu: [
            {
                label: 'Minimize',
                accelerator: 'CommandOrControl+M',
                role: 'minimize',
            },
            {
                label: 'Close',
                accelerator: 'Shift+CommandOrControl+W',
                role: 'close',
            },
        ]
    },
    {
        label: 'Help',
        role: 'help',
        submenu: [
            {
                label: 'Visit Website',
                // TODO completed
                click() {
                    alert('to be implemented');
                }
            },
            {
                label: 'Toggle Developer Tools',
                click(item, focusedWindow) {
                    if(focusedWindow) {
                        focusedWindow.webContents.toggleDevTools();
                    }
                }
            },
        ]
    },
];

if (process.platform === 'darwin') {
    const name = 'FireSale';
    template.unshift({
        label: name,
        submenu: [
            {
                label: `About ${name}`,
                role: 'about',
            },
            {
                type: 'separator'
            },
            {
                label: 'Services',
                role: 'services',
                submenu: [],
            },
            {
                type: 'separator',
            },
            {
                label: `Hide ${name}`,
                accelerator: 'Command+H',
                role: 'hide',
            },
            {
                label: 'Hide Others',
                accelerator: 'Command+Alt+H',
                role: 'hideOthers',
            },
            {
                label: 'Show All',
                role: 'unHide',
            },
            {
                label: 'separator',
            },
            {
                label: `Quit ${name}`,
                accelerator: 'Command+Q',
                click() {
                    app.quit();
                }
            }
        ]
    });

    const windowMenu = template.find( item => item.label === 'Window');
    windowMenu.role = 'window';
    windowMenu.submenu.push(
        {
            type: 'separator',
        },
        {
            label: 'Bring All to Front',
            role: 'front',
        }
    );
}

module.exports = Menu.buildFromTemplate(template);