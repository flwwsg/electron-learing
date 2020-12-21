const { shell } = require('electron');

const parser = new DOMParser();

const linkSection = document.querySelector('.links');
const errorMessage = document.querySelector('.error-message');
const newLinkForm = document.querySelector('.new-link-form');
const newLinkUrl = document.querySelector('.new-link-url');
const newLinkSubmit = document.querySelector('.new-link-submit');
const clearStorageButton = document.querySelector('.clear-storage');

newLinkUrl.addEventListener('keyup', () => {
    newLinkSubmit.disabled = !newLinkUrl.validity.valid;
});

newLinkForm.addEventListener('submit', (event) => {
    // 阻止提交
    event.preventDefault();
    const url = newLinkUrl.value;
    fetch(url)
        .then(resp => resp.text())
        .then(parseResponse)
        .then(findTitle)
        .then(title => storeLink(title, url))
        .then(clearForm)
        .then(renderLinks)
        .catch(error => handleError(error, url));
});

// 点击清除按钮时，清除表格
clearStorageButton.addEventListener('click', () => {
    localStorage.clear();
    linkSection.innerHTML = '';
});

// 点击 url 时，调用外部浏览器
linkSection.addEventListener('click', (event) => {
    if(event.target.href) {
        event.preventDefault();
        shell.openExternal(event.target.href);
        // electron 调用打开
        // window.open(event.target.href);
    }
});

const clearForm = () => {
    newLinkUrl.value = null;
}

const parseResponse = (text) => {
    console.log(text);
    return parser.parseFromString(text, 'text/html');
}

const findTitle = (nodes) => {
    return nodes.querySelector('title').innerText;
}

const storeLink = (title, url) => {
    localStorage.setItem(url, JSON.stringify({title, url}));
}

const getLinks = () => {
    return Object.keys(localStorage)
        .map(key => JSON.parse(localStorage.getItem(key)));
}

const convertToElement = (link) => {
    return `<div class="link"><h3>${link.title}</h3>
            <p><a href="${link.url}">${link.url}</a></p>
            </div>`
}

const renderLinks = () => {
    linkSection.innerHTML = getLinks().map(convertToElement).join('');
}

const handleError = (error, url) => {
    errorMessage.innerHTML = `There was an issue adding "${url}": ${error.message}.`;
    setTimeout(() => errorMessage.innerText = null, 5000);
}

renderLinks();
console.log('start render');