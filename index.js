const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes/index.js');
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (request, response) => {
    response.send('Hello world');
});

app.use(routes);

app.listen(port, () => {
  console.log(`Servidor funcionando na porta: ${port}.`);
});