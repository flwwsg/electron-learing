'use strict';
// 从剪辑板中复制内容
const path = require('path');
const {
    app,
    BrowserWindow,
    globalShortcut,
    Menu,
    Tray,
    nativeImage,
    clipboard
} = require('electron');

const clippings = [];
let tray = null;
let browserWindow = null;

const getIcon = () => {
    if (process.platform === 'win32') {
        return 'icon-light@2x.ico';
    }
    // mac os, 需要 png 格式
    if (nativeImage.shouldUseDarkColors) {
        return 'icon-light.png'
    }
    return 'icon-dark.png';
};

app.on('ready', () => {
    if (app.dock) {
        app.dock.hide();
    }
    tray = new Tray(path.join(__dirname, getIcon()));
    // mac os 下的按压效果
    tray.setPressedImage(path.join(__dirname, 'icon-light.png'));
    if (process.platform === 'win32') {
        tray.on('click', ((event, bounds, position) => {
            tray.popUpContextMenu();
        }));
    }
    browserWindow = new BrowserWindow({
        show: false,
        webPreferences: {
            // 使用 node 环境
            nodeIntegration: true,
        },
    });

    browserWindow.loadURL(`file://${__dirname}/index.html`);
    const activationShortcut = globalShortcut.register('CommandOrControl+Option+Y', () => {
        tray.popUpContextMenu();
    });

    if (!activationShortcut) {
        console.error('ctrl+option+Y register fail. 注册失败，热键冲突');
    }

    // 记录新剪辑
    const newClippingShortcut = globalShortcut.register('CommandOrControl+Shift+Option+Y', () => {
        const clipping = addClipping();
        if (clipping) {
            browserWindow.webContents.send('show-notification', 'clipping added', clipping);
        }
    });

    if (!newClippingShortcut) {
        console.error('ctrl+shift+option+c register fail. 注册失败，热键冲突');
    }
    tray.setToolTip('Clipmaster');
    updateMenu();

});

const addClipping = () => {
    const clipping = clipboard.readText();
    console.log('clipping', clipping);
    if (clippings.includes(clipping)) {
        return;
    }
    clippings.unshift(clipping);
    updateMenu();
    return clipping;
};

const updateMenu = () => {
    const menu = Menu.buildFromTemplate([
        {
            label: 'Create new clipping',
            click() {
                addClipping();
            },
            accelerator: 'CommandOrControl+Shift+C'
        },
        {
            type: 'separator',
        },
        ...clippings.slice(0, 10).map(createClippingMenuItem),
        {
            type: 'separator',
        },
        {
            label: 'Quit',
            click() {
                app.quit();
            },
            accelerator: 'CommandOrControl+Q'
        }
    ]);
    tray.setContextMenu(menu);
};

const createClippingMenuItem = (clipping, index) => {
    return {
        label: clipping.length > 20 ? clipping.slice(0, 20) + '...': clipping,
        click() {
            // 写入剪辑板，同时需要ctrl+v从剪辑板复制出来
            clipboard.writeText(clipping);
        },
        accelerator: `CommandOrControl+${index}`
    }
}
