const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const { CPTEC_URL, WIND_SWELL_DIRECTIONS } = require('../service/constants.js');
const parser = new XMLParser();

const getAllCitiesData = async (request, response) => {

  const citiesData = await axios.get(`${CPTEC_URL}/listaCidades`, {
    responseType: 'application/xml',
    responseEncoding: 'binary',
  });

  console.log(parser.parse(citiesData.data).cidades.cidade);

  if (parser.parse(citiesData.data).cidades.cidade) {
    response.status(200).json(parser.parse(citiesData.data).cidades.cidade)
  }

  return [];
};

const getCityData = async (request, response) => {
  const { name } = request.params;
  const citiesData = await axios.get(`${CPTEC_URL}/listaCidades?city=${name}`, {
    responseType: 'application/xml',
    responseEncoding: 'binary',
  });

  const formatCityData = parser.parse(citiesData.data);
  const newCity = {
    nome: formatCityData.cidade.nome,
    estado: formatCityData.cidade.uf,
    id: formatCityData.cidade.id
  } || [];

  console.log(formatCityData);
  console.log(newCity);

  if (parser.parse(citiesData.data).cidades.cidade) {
    console.log(parser.parse(citiesData.data).cidades.cidade.formatCityData);
    response.status(200).json(parser.parse(citiesData.data).cidades.cidade.formatCityData);
  }
  return [];
};

const getSwellData = async (request, response) => {
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

    newSwellArr.ondas = [];

    response.status(200).json(newSwellArr);

    if (newSwellArr.ondas.length > days) {
      console.log(newSwellArr.ondas)
      newSwellArr.ondas = newSwellArr.ondas.slice(0, days);
      response.status(200).json(newSwellArr.ondas);
    }

    return newSwellArr;
  } catch (e) {
    return null;
  }
};

const getCurrentCapitalWeatherdata = async (request, response) => {
  const currentData = await axios.get(
    `${CPTEC_URL}/capitais/condicoesAtuais.xml`,
    {
      responseType: 'application/xml',
      responseEncoding: 'utf-8',
    }
  );

  // * Format meteorology metadata
// * @param {object} item
// * @returns {object}
// */
// function formatMetar(item) {
//  const newItem = item;
//  newItem.codigo_icao = item.codigo;
//  newItem.pressao_atmosferica = item.pressao;
//  newItem.vento = item.vento_int;
//  newItem.direcao_vento = item.vento_dir;
//  newItem.condicao = item.tempo;
//  newItem.condicao_desc = item.tempo_desc;
//  newItem.temp = item.temperatura;
//  newItem.atualizado_em = normalizeBrazilianDate(item.atualizacao);

//  delete newItem.codigo;
//  delete newItem.pressao;
//  delete newItem.vento_int;
//  delete newItem.vento_dir;
//  delete newItem.tempo;
//  delete newItem.tempo_desc;
//  delete newItem.temperatura;
//  delete newItem.atualizacao;

//  return newItem;
// }

// /**
// * Format prediction to return
// * @param {object} unformattedData
// * @returns {object}
// */
// function formatPrediction(unformattedData) {
//  const formattedData = {
//    cidade: unformattedData.cidade.nome,
//    estado: unformattedData.cidade.uf,
//    atualizado_em: unformattedData.cidade.atualizacao,
//    clima: unformattedData.cidade.previsao.map((oneDay) => {
//      return {
//        data: oneDay.dia,
//        condicao: oneDay.tempo,
//        condicao_desc: CONDITION_DESCRIPTIONS[oneDay.tempo],
//        min: oneDay.minima,
//        max: oneDay.maxima,
//        indice_uv: oneDay.iuv,
//      };
//    }),
//  };
//  return formattedData;
// }

  const parsedData = parser.parse(currentData.data);

  if (parsedData.capitais.metar) {
    response.status(200).json(parsedData.capitais.metar);
  }
  return [];
}

const getCurrentAirportWeather = async (request, response) => {
  const { icaoCode } = request.params;
  const airportWeather = await axios.get(
    `${CPTEC_URL}/estacao/${icaoCode}/condicoesAtuais.xml`,
    {
      responseType: 'application/xml',
      responseEncoding: 'utf-8',
    }
  );
  const parsed = parser.parse(airportWeather.data);

  if (parsed.metar) {
    response.status(200).json(parsed.metar);
  }
  return [];
};

const getPredictionWeather = async (request, response) => {
  const { cityCode, days } = request.params;
  const baseUrl = `${CPTEC_URL}/cidade/`;
  let url = baseUrl;
  if (days <= 4) {
    url += `${cityCode}/previsao.xml`;
  } else {
    url += `7dias/${cityCode}/previsao.xml`;
  }

  const weatherPredictions = await axios.get(url, {
    responseType: 'application/xml',
    responseEncoding: 'binary',
  });

  const parsed = parser.parse(weatherPredictions.data);

  if (parsed.cidade) {
    const jsonData = parsed;
    if (jsonData.cidade === 'null') {
      return null;
    }

    if (jsonData.length > days) {
      jsonData.clima = jsonData.clima.slice(0, days);
    }

    response.status(200).json(jsonData);
  }
  return [];
};

module.exports = {
  getAllCitiesData,
  getCityData,
  getSwellData,
  getCurrentCapitalWeatherdata,
  getCurrentAirportWeather,
  getPredictionWeather
};