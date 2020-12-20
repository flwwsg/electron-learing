// node process, does not have DOM, and can not render a UI
const { app, BrowserView } = require('electron');

app.on('ready', () => {
   console.log('hello electron');
});