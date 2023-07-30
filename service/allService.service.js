const axios = require('axios');
const { XMLParser } = require('fast-xml-parser');
const { CPTEC_URL, CONDITION_DESCRIPTIONS } = require('../helper/constants.js');
const parser = new XMLParser();

function formatMetar(item) {
  return {
     codigo_icao: item.codigo,
     pressao_atmosferica: item.pressao,
     vento: item.vento_int,
     direcao_vento: item.vento_dir,
     condicao: item.tempo,
     condicao_desc: item.tempo_desc,
     temp: item.temperatura,
     atualizado_em: item.atualizacao,
  }
}

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

const getAllCitiesData = async (request, response) => {
try {
  const citiesData = await axios.get(`${CPTEC_URL}/listaCidades`, {
    responseType: 'application/xml',
    responseEncoding: 'binary',
  });

  if (parser.parse(citiesData.data).cidades.cidade) {
    response.status(200).json(parser.parse(citiesData.data).cidades.cidade)
  }

  return [];
} catch (e) {
  response.status(400).json({
    success: false,
    message: `Não foi possivel acessar a rota /weather.`
  })
  return e.message;
}
};

const getCityData = async (request, response) => {
try {
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

  if (parser.parse(citiesData.data).cidades.cidade) {
    console.log(parser.parse(citiesData.data).cidades.cidade.formatCityData);
    response.status(200).json(parser.parse(citiesData.data).cidades.cidade.formatCityData);
  }
  return [];
} catch (e) {
  response.status(400).json({
    success: false,
    message: e.message
  })
}
};

const getSwellData = async (request, response) => {
  try {
    const { cityCode, days } = request.params;
    const url = `${CPTEC_URL}/cidade/${cityCode}/todos/tempos/ondas.xml`;

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
    response.status(400).json({
      success: false, 
      message: e.message
    })
  }
};

const getCurrentCapitalWeatherdata = async (request, response) => {
  try {
    const currentData = await axios.get(
      `${CPTEC_URL}/capitais/condicoesAtuais.xml`,
      {
        responseType: 'application/xml',
        responseEncoding: 'utf-8',
      }
    );
  
    const parsed = parser.parse(currentData.data);
  
    if (parsed.capitais.metar) {
      response.status(200).json(parsed.capitais.metar.map(formatMetar));
    }
    return [];
  } catch (e) {
    response.status(400).json({
      success: false, 
      message: e.message
    })
  }
}

const getCurrentAirportWeather = async (request, response) => {
  try {
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
      response.status(200).json(formatMetar(parsed.metar));
    }
    return [];
  } catch (e) {
    response.status(400).json({
      success: false, 
      message: e.message
    })
  }
};

const getPredictionWeather = async (request, response) => {
  try {
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
      const jsonData = formatPrediction(parsed);
      if (jsonData.cidade === 'null') {
        return null;
      }
  
      if (jsonData.length > days) {
        jsonData.clima = jsonData.clima.slice(0, days);
      }
  
      response.status(200).json(jsonData);
    }
    return [];
  } catch (e) {
    response.status(400).json({
      success: false, 
      message: e.message
    })
  }
};

module.exports = {
  getAllCitiesData,
  getCityData,
  getSwellData,
  getCurrentCapitalWeatherdata,
  getCurrentAirportWeather,
  getPredictionWeather
};