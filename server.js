const express = require('express');
const path = require('path');
const uploadRouter = require('./routes/upload');

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use('/', uploadRouter);

app.listen(port, () => {
  console.log('Server listening on http://localhost:' + port);
});