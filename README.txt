This project is written in Node js framework in VS Code ide.

To run this project:
--------------------

1. Open this folder in VS Code or any similar ide.

2. Install dependencies using following command:
   
    npm install express axios redis nodemon

3. Download Redis server from http://download.redis.io/releases/redis-6.0.8.tar.gz .

4. Open redis-server file in the downloded folder.

It will start Redis server in port: 6379 .

5. Open new Terminal in VS Code and enter command:

    npm start

    It will start Node server in localhost:8080 .

6. Open browser and enter:
    
    localhost:8080/metar/ping.
    
    It should return 'pong' as result.

7. Make your query in the form: 
    
    localhost:8080/metar/info?scode=____&nocache=_ .
    
    where first blank fits the scode and second blank fills 0 or 1 depenfing on whether you want cached data or live data.


Assumptions I have made:
--------------------------
1. The part of response which gives information about wind always ends with 'KT' meaning that the wind speed is in knots.

2. The part of response which gives information about temperature is always of ythe form: --/--  , indicating temperature in celcius and dew point.

3. Time given is always in GMT.