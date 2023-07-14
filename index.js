const express = require('express');
const axios = require('axios');
const app = express();
const bodyParser = require('body-parser');
const { XMLParser } = require('fast-xml-parser');
const parser = new XMLParser();
const { CPTEC_URL, WIND_SWELL_DIRECTIONS } = require('./service/constants.js');
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

app.get('/swell/:cityCode/dia/:days', async (request, response) => {
  const { cityCode, days } = request.params;
  const url = `${CPTEC_URL}/cidade/${cityCode}/todos/tempos/ondas.xml`;

  try {
    const swellData = await axios.get(url, {
      responseType: 'application/xml',
      responseEncoding: 'binary',
    });

    const jsonData = parser.parse(swellData.data);
    const newSwellArr = {
      cidade: jsonData.cidade.nome,
      estado: jsonData.cidade.uf,
      atualizado_em: jsonData.cidade.atualizacao,
      ondas: [],
    };

    let oldDate = '';

    let newItem = {};

    newSwellArr.ondas = [];

    console.log(jsonData)

    jsonData.cidade.previsao.forEach((oneDay) => {
      const datePart = oneDay.dia.split(' ');
      const [date, hour, tz] = datePart;

      if (date !== oldDate) {
        [oldDate] = datePart;

        newItem = {};
        [newItem.data] = normalizeBrazilianDate(oldDate, '-', false)
          .toISOString()
          .split('T');
        newItem.dados_ondas = [];
        newSwellArr.ondas.push(newItem);
      }

      newItem.dados_ondas.push({
        hora: `${hour.replace('h', ':')}00${tz}`,
        vento: oneDay.vento,
        direcao_vento: oneDay.vento_dir,
        direcao_vento_desc: WIND_SWELL_DIRECTIONS[oneDay.vento_dir],
        altura_onda: oneDay.altura,
        direcao_onda: oneDay.direcao,
        direcao_onda_desc: WIND_SWELL_DIRECTIONS[oneDay.direcao],
        agitation: oneDay.agitacao,
      });

      
      response.json(newItem);
    });

    if (newSwellArr.ondas.length > days) {
      console.log(newSwellArr.ondas)
      newSwellArr.ondas = newSwellArr.ondas.slice(0, days);
    }
    console.log(newSwellArr)
    response.json(newSwellArr);
  } catch (e) {
    return null;
  }
})

app.listen(port, () => {
    console.log(`Servidor funcionando na porta: ${port}.`);
});