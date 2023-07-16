const express = require('express');
const axios = require('axios');
const app = express();
const bodyParser = require('body-parser');
const { XMLParser } = require('fast-xml-parser');
const parser = new XMLParser();
const { CPTEC_URL, WIND_SWELL_DIRECTIONS } = require('./service/constants.js');
const { json } = require('body-parser');
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

function formatPrediction(unformattedData) {
  const formattedData = {
    cidade: unformattedData.cidade.nome,
    estado: unformattedData.cidade.uf,
    atualizado_em: unformattedData.cidade.atualizacao,
    clima: unformattedData.cidade.previsao.map((oneDay) => {
      return {
        data: oneDay.dia,
        condicao: oneDay.tempo,
        condicao_desc: CONDITION_DESCRIPTIONS[oneDay.tempo],
        min: oneDay.minima,
        max: oneDay.maxima,
        indice_uv: oneDay.iuv,
      };
    }),
  };
  return formattedData;
}

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
});

app.get('/cities?city:name', async (request, response) => {
  const { name } = request.params;
  const citiesData = await axios.get(`${CPTEC_URL}/listaCidades?city=${name}`, {
    responseType: 'application/xml',
    responseEncoding: 'binary',
  });

  // const formatCity = citiesData.map((city) => {
  //   return [
  //     json({
  //       nome: city.nome,
  //       estado: city.uf,
  //       id: city.id
  //   })];
  // }, []);

  const formatCity = parser.parse(citiesData.data);
  const newCity = formatCity.map((city) => {
      return [
        json({
          nome: city.nome,
          estado: city.uf,
          id: city.id
      })];
    }, []);
  console.log(formatCity);
  console.log(newCity);

  if (parser.parse(citiesData.data).cidades.cidade) {
    console.log(parser.parse(citiesData.data).cidades.cidade.formatCity);
    response.status(200).json(parser.parse(citiesData.data).cidades.cidade.formatCity);
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

    // console.log(JSON.stringify(jsonData))
    // console.log(JSON.stringify(newSwellArr))
    response.status(200).json(newSwellArr);

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

      return newItem;
    });

    if (newSwellArr.ondas.length > days) {
      console.log(newSwellArr.ondas)
      newSwellArr.ondas = newSwellArr.ondas.slice(0, days);
      response.status(200).json(newSwellArr.ondas);
    }

    //response.status(200).json(newSwellArr);
    return newSwellArr;
  } catch (e) {
    return null;
  }
});

app.get('/weather', async (request, response) => {
  const currentData = await axios.get(
    `${CPTEC_URL}/capitais/condicoesAtuais.xml`,
    {
      responseType: 'application/xml',
      responseEncoding: 'utf-8',
    }
  );

  const parsed = parser.parse(currentData.data);

  if (parsed.capitais.metar) {
    response.status(200).json(parsed.capitais.metar);
  }
  return [];
})

app.listen(port, () => {
    console.log(`Servidor funcionando na porta: ${port}.`);
});