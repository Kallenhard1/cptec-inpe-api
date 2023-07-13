const express = require('express');
const axios = require('axios');
const app = express();
const bodyParser = require('body-parser');
const { XMLParser } = require('fast-xml-parser');
const parser = new XMLParser();
const { CPTEC_URL } = require('./service/constants.js');
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (request, response) => {
    response.send('Hello world');
});

app.get('/cities', async (request, response) => {

  const citiesData = await axios.get(`${CPTEC_URL}/listaCidades`, {
    responseType: 'application/xml',
    responseEncoding: 'binary',
  });

  console.log(parser.parse(citiesData.data).cidades.cidade);

  if (parser.parse(citiesData.data).cidades.cidade) {
    response.status(200).json(parser.parse(citiesData.data).cidades.cidade)
  }

  return [];
})

app.listen(port, () => {
    console.log(`Servidor funcionando na porta: ${port}.`);
});