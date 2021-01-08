const {clipboard, ipcRenderer, shell} = require('electron');

const request = require('request').default({
    url: 'https://api.github.com/gists',
    headers: {
        'User-Agent': 'Clipmaster 9000'
    }
});

const clippingsList = document.getElementById('clippings-list');
const copyFromClipboardButton = document.getElementById('copy-from-clipboard');

ipcRenderer.on('create-new-clipping', () => {
    addClippingToList();
    new Notification('Clipping Added', {
        body: `${clipboard.readText()}`
    })
});

ipcRenderer.on('write-to-clipboard', () => {
    const clipping = clippingsList.firstChild;
    writeToClipboard(getClippingText(clipping));
    new Notification('Clipping Copied', {
        body: `${clipboard.readText()}`
    })
});

ipcRenderer.on('publish-clipping', () => {
    const clipping = clippingsList.firstChild;
    publishClipping(getClippingText(clipping));
});

const createClippingElement = clippingText => {
    const clippingElement = document.createElement('article');
    clippingElement.classList.add('clippings-list-item');

    clippingElement.innerHTML = `
<div class="clipping-text" disabled="true"></div>
<div class="clippings-controls">
<button class="copy-clipping">Clipboard</button>
<button class="publish-clipping">Publish</button>
<button class="remove-clipping">Remove</button>
</div>
`;
    clippingElement.querySelector('.clippings-text').innerText = clippingText;
    return clippingElement;
};

const addClippingToList = () => {
    const clippingText = clipboard.readText();
    const clippingElement = createClippingElement(clippingText);
    clippingsList.prepend(clippingElement);
}

copyFromClipboardButton.addEventListener('click', addClippingToList);

clippingsList.addEventListener('click', event => {
    const hasClass = className => event.target.classList.contains(className);
    const clippingListItem = getButtonParent(event);
    if (hasClass('remove-clipping')) {
        removeClipping(clippingListItem);
    }
    if (hasClass('copy-clipping')) {
        writeToClipboard(getClippingText(clippingListItem));
    }
    if(hasClass('publish-clipping')) {
        publishClipping(getClippingText(clippingListItem));
    }
})

const removeClipping = target => {
    target.remove();
};

const writeToClipboard = clippingText => {
    clipboard.writeText(clippingText);
};

const publishClipping = clippingText => {
    request.post(toJSON(clippingText), (err, response, body) => {
        if (err) {
            return new Notification('Error Publish Your Clipping', {
                body: JSON.parse(err).message,
            });
        }

        const gistUrl = JSON.parse(body).html_url;
        const notification = new Notification('Your clipping has been published', {
            body: `Click to open ${gistUrl} in your browser`
        });

        notification.onclick = () => {
            shell.openExternal(gistUrl).then(res => {
                console.log(res);
            }).catch(err => {
                console.error(err);
            })
        };
        clipboard.writeText(gistUrl);
    });
};

const getButtonParent = ({ target }) => {
    return target.parentNode.parentNode;
};

const getClippingText = clippingListItem => {
    return clippingListItem.querySelector('.clipping-text').innerText;
};

const toJSON = clippingText => {
    return {
        body: JSON.stringify({
            description: 'created with clipmaster 9000',
            public: 'true',
            files: {
                'clipping.txt': { content: clippingText }
            }
        })
    }
};
