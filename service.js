// axios for making get call to https://tgftp.nws.noaa.gov/data/observations/metar/stations/
const axios = require('axios');
// redis for caching
const redis = require('redis');

const URL = "https://tgftp.nws.noaa.gov/data/observations/metar/stations/";

// Default port number for redis: 6379
const REDIS_PORT = process.env.PORT || 6379;
const client = redis.createClient(REDIS_PORT);

// Fetching the data either from cache or live data depending on nocache parameter
exports.fetch = async (sCode, noCache, res) => {
    
    let data = {};

    // Fetch live data if cocache = 1
    if(noCache == 1) {
        data = await getResult(sCode, res);

        res.send({
            data: data
        });
    }

    // Fetch data from cache if present
    else {
        client.get(sCode, async (err, value) => {
            if(err) {
                console.log("error in redis-client-get");
                throw err;
            }
            
            // data present in cache
            if(value) {
                data = JSON.parse(value);
                res.send({
                    data: data
                });
            }
            // data not present in cache
            else {
                let result = await getResult(sCode, res);
                res.send({
                    data: result
                });
            }
        })
    } 
}

const getData = async (url, res) => {
    try{
        const res = await axios.get(url);
        return res.data;
    }
    catch(err) {
        res.send("This scode doesn't exist");
    }    
}

// Fetching fresh data from the web using scode
const getResult = async (sCode, res) => {

    // get data from web
    let text = await getData(URL+sCode+".TXT", res);

    // splitting the obtained data into tokens
    let data = text.split(" ");

    let time = data[0]+" at "+data[1].substring(0, data[1].length-5)+" GMT";

    // let temp = getTemp(data[7]);    
    // let wind = getWind(data[4]);

    let wind = "";
    let temp = "";

    // Reading each token
    data.map(token => {
        let len = token.length;

        if(len > 2) {
            if(token.substring(len-2, len) === "KT") {
                // wind will always be represented with KT at end 
                wind = getWind(token);
            }
            else if(isTemperature(token, len)) {
                temp = getTemp(token);
            }
        }
    })

    // result in json format
    const result = {
        station: sCode,
        last_observation: time,
        temperature: temp,
        wind: wind
    }

    // Saving the result in cache in string form with the scode as the key
    client.setex(sCode, 300, JSON.stringify(result));

    return result;
}

// Returns wind speed with direction and gust if present
const getWind = (wind) => {

    // Angle of wind in degree
    let wind_degree = parseInt(wind.substring(0, 3));
    let wind_dirn = '';

    // Finding direction of wind with using it's angle
    if(wind_degree > 315 || wind_degree <= 45) {
        wind_dirn = 'N';
    }
    else if(wind_degree > 45 && wind_degree <= 135) {
        wind_dirn = 'E';
    }
    else if(wind_degree > 135 && wind_degree <= 225) {
        wind_dirn = 'S';
    }
    else {
        wind_dirn = 'W';
    }

    let wind_speed_knots = parseInt(wind.substring(3, 5));

    // check if wind speed is in 3 digits (i.e, > 99)
    if(!isNaN(wind.charAt(5))) {
        wind_speed_knots = (wind_speed_knots*10)+parseInt(wind.charAt(5));
    }

    // Converting knots to mph
    let wind_speed_mps = Math.round(wind_speed_knots/0.868976);
    
    let result = wind_dirn+" at "+wind_speed_mps+" mph ("+wind_speed_knots+" knots)";

    // Adding the gust speed to information if present
    if((wind.split("G")).length > 1) {
        let gust_speed = (wind.split("G"))[1];
        gust_speed = gust_speed.substring(0, gust_speed.length-2);

        result += " , gusting at "+gust_speed+" knots";
    }    
    return result;
}

// Returns temperature in celcius as well as fahrenheit
const getTemp = (temperature) => {

    // Spliting token into temperature and dew point
    let temp = (temperature.split("/"))[0];

    // M at begining represents negative or Minus temperature
    if(temperature.charAt(0) === 'M') {
        temp = '-'+temp.substring(1, temp.length);
    }

    // temperature in celcius
    let temp_c = parseInt(temp);
    // temperature in fahrenheit
    let temp_f = Math.round((9*temp_c/5)+32);

    temp += " C ("+temp_f+" F)";

    return temp;
}

// return true if the given token represents temperature
const isTemperature = (token, len) => {

    // If token string does not contain '/' then it's not temperature 
    if(token.split("/").length < 2)
    return false;

    // Spliting token into temperature and dew point
    let split_token = token.split("/");

    if(split_token[0].charAt(0) === 'M') {
        split_token[0] = split_token[0].substring(1, split_token[0].length);
    }

    if(split_token[1].charAt(0) === 'M') {
        split_token[1] = split_token[1].substring(1, split_token[1].length);
    }

    // If any alphabet is present then it's not temperature
    if(isNaN(split_token[0]) || isNaN(split_token[1])) {
        return false;
    }

    return true;
}