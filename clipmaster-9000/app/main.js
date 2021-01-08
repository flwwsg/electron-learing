'use strict';
const Menubar = require('menubar');
const { globalShortcut, Menu } = require('electron');

const menubar = Menubar.menubar(
    {
        preloadWindow: true,
        index: `file://${__dirname}/index.html`,
        // nodeIntegration: true,
    }
)

menubar.on('ready', () => {
    const secondaryMenu = Menu.buildFromTemplate([
        {
            label: 'Quit',
            click() {
                menubar.app.quit();
            },
            accelerator: 'CommandOrControl+Q',
        }
    ]);

    // 右键目录
    menubar.tray.on('right-click', () => {
        menubar.tray.popUpContextMenu(secondaryMenu);
    });

    const createClipping = globalShortcut.register('CommandOrControl+!', () => {
        menubar.window.webContents.send('create-new-clipping');
    });

    const writeClipping = globalShortcut.register('CommandOrControl+Alt+@', () => {
        menubar.window.webContents.send('write-to-clipboard');
    });

    const publishClipping = globalShortcut.register('CommandOrControl+Alt+#', () => {
        menubar.window.webContents.send('publish-clipping');
    });

    if (!createClipping) {
        console.error('registration failed', 'createClipping');
    }
    if (!writeClipping) {
        console.error('registration failed', 'writeClipping');
    }
    if (!publishClipping) {
        console.error('registration failed', 'publishClipping');
    }
})
