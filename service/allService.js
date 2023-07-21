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

  const parsedData = parser.parse(currentData.data);

  if (parsedData.capitais.metar) {
    response.status(200).json(parsedData.capitais.metar);
  }
  return [];
}

module.exports = {
  getAllCitiesData,
  getCityData,
  getSwellData,
  getCurrentCapitalWeatherdata
};