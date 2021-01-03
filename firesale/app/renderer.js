const {remote, ipcRenderer, dialog} = require('electron');
const path = require('path');
// remote 可以从mainProcess导入函数，反之不行
const mainProcess = remote.require('./main.js');
const currentWindow = remote.getCurrentWindow();
const marked = require('marked');
const { Menu } = remote;

const markdownView = document.querySelector('#markdown');
const htmlView = document.querySelector('#html');
const newFileButton = document.querySelector('#new-file');
const openFileButton = document.querySelector('#open-file');
const saveMarkdownButton = document.querySelector('#save-markdown');
const revertButton = document.querySelector('#revert');
const saveHtmlButton = document.querySelector('#save-html');
const showFileButton = document.querySelector('#show-file');
const openInDefaultButton = document.querySelector('#open-in-default');

let filePath = null;
let originContent = '';

// helper function

// 判断文件是否更改
const isDifferentContent = (content) => content !== markdownView.value;

const renderMarkdownToHtml = (markdown) => {
    htmlView.innerHTML = marked(markdown, {sanitize: true});
};

const renderFile = (file, content) => {
    filePath = file;
    originContent = content;
    markdownView.value = content;
    renderMarkdownToHtml(content);
    updateUserInterface(false);
}

// 更新窗口状态--标题是否编辑中等等
const updateUserInterface = (isEdited) => {
    let title = 'Fire Sale';

    if (filePath) {
        title = `${path.basename(filePath)} - ${title}`;
    }
    if (isEdited) {
        title = `${title} (编辑中)`;
    }

    currentWindow.setTitle(title);
    currentWindow.setDocumentEdited(isEdited);
    // 支持 windows
    currentWindow.isEdited = isEdited;
    saveMarkdownButton.disabled = !isEdited;
    revertButton.disabled = !isEdited;
}

// listener and event

markdownView.addEventListener('keyup', (event) => {
    const currentContent = event.target.value;
    renderMarkdownToHtml(currentContent);
    updateUserInterface(currentContent !== originContent);
});

newFileButton.addEventListener('click', () => {
    mainProcess.createWindow();
});

openFileButton.addEventListener('click', () => {
    // 调用 mainProcess 中函数
    mainProcess.getFileFromUser(currentWindow);
});

saveMarkdownButton.addEventListener('click', () => {
    mainProcess.saveMarkdown(currentWindow, filePath, markdownView.value);
});

// 撤销编辑的内容
revertButton.addEventListener('click', () => {
    markdownView.value = originContent;
    renderMarkdownToHtml(originContent);
});

saveHtmlButton.addEventListener('click', () => {
    mainProcess.saveHtml(currentWindow, htmlView.innerHTML);
});

ipcRenderer.on('file-opened', (event, file, content) => {
    console.debug('is windows edited', currentWindow.isEdited);
    // 检查当前文档是否已经保存
    if(currentWindow.isEdited && isDifferentContent(content)) {
        // Use main process modules from the renderer process.需要在 remote 中引用 mainProcess dialog。
        remote.dialog.showMessageBox(currentWindow, {
            type: 'warning',
            title: '覆盖当前未保存的文档？',
            message: '打开新文档将丢失当前文件更改的内容。是否仍然打开？',
            buttons: [
                '是',
                '否',
            ],
            defaultId: 0,
            cancelId: 1
        }).then(result => {
            if(result.response === 0) {
                renderFile(file, content);
            }
        });
    } else {
        renderFile(file, content);
    }
});

ipcRenderer.on('file-changed', (event, file, content) => {
    if(!isDifferentContent(content)) {
        // 文档未更新
        return;
    }
    remote.dialog.showMessageBox(currentWindow, {
        type: 'warning',
        title: '覆盖当前未保存的文档？',
        message: '当前文件被其它程序改动，是否重新打开？',
        buttons: [
            '是',
            '否',
        ],
        defaultId: 0,
        cancelId: 1,
    }).then(result => {
        if (result.response === 0) {
            renderFile(file, content);
        }
    })
});

// 拖拽文件
// 禁止浏览器默认行为
document.addEventListener('dragstart', event => event.preventDefault());
document.addEventListener('dragover', event => event.preventDefault());
document.addEventListener('dragleave', event => event.preventDefault());
document.addEventListener('drop', event => event.preventDefault());
// TODO 检查文件类型， 现在临时处理文件类型
// const getDraggedFile = (event) => event.dataTransfer.items[0];
const getDraggedFile = (event) => event.dataTransfer.files[0];
const getDroppedFile = (event) => event.dataTransfer.files[0];

const fileTypeSupported = (file) => {
    console.log('drag file:', file, path.extname(file.path));
    return file.path && path.extname(file.path) === '.md' || ['text/plain', 'text/markdown'].includes(file.type);
};

markdownView.addEventListener('dragover', (event) => {
    const file = getDraggedFile(event);
    if (fileTypeSupported(file)) {
        markdownView.classList.add('drag-over');
    } else {
        markdownView.classList.add('drag-error');
    }
});

// 移除拖拽 css 类
markdownView.addEventListener('dragleave', (event) => {
    markdownView.classList.remove('drag-over');
    markdownView.classList.remove('drag-error');
});

markdownView.addEventListener('drop', (event) => {
    const file = getDroppedFile(event);
    if(fileTypeSupported(file)) {
        mainProcess.openFile(currentWindow, file.path);
    } else {
        alert('文件不支持');
    }
    markdownView.classList.remove('drag-over');
    markdownView.classList.remove('drag-error');
});

// 目录菜单、右键菜单
ipcRenderer.on('save-markdown', () => {
    if (markdownView.value === '') {
        alert('没有需要保存的文档');
        return;
    }
    mainProcess.saveMarkdown(currentWindow, filePath, markdownView.value);
});

ipcRenderer.on('save-html', () => {
    if (htmlView.innerHTML === '') {
        alert('没有需要保存的文档');
        return;
    }
    mainProcess.saveHtml(currentWindow, htmlView.innerHTML);
});

const markdownContextMenu = Menu.buildFromTemplate([
    {
        label: 'Open FIle',
        click() {
            mainProcess.getFileFromUser(currentWindow);
        }
    },
    {
        type: 'separator'
    },
    {
        label: 'Cut',
        role: 'cut',
    },
    {
        label: 'Copy',
        role: 'copy',
    },
    {
        label: 'Paste',
        role: 'paste',
    },
    {
        label: 'Select All',
        role: 'selectAll'
    }
]);

markdownView.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    markdownContextMenu.popup();
});