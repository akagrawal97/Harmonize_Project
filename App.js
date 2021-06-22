const express = require('express');
const app = express();
// service.js contains the functions to fetch and output the data in appropriate form
const service = require('./service'); 

// Port number for the node server
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log("SERVER STARTED...");
});

// Routing for localhost:8080/metar/ping
app.get('/metar/ping', (req, res) => {
    res.send({
        data : "pong"
    });
})

// Routing for localhost:8080/metar/info?scode=____&nocache=_
app.get('/metar/info/', (req, res) => {
    const sCode = req.query.scode;
    const noCache = req.query.nocache;
    
    // Calling fetch method from service.js
    service.fetch(sCode, noCache, res);
});
