const request = require('request');

function getCompanies(name, res, handleCompanies, handlePrice) {
    request.get('https://trade-junky.appspot.com/companysearch?name=' + name, function(error, response, body) {
        console.log('error:', error); // Print the error if one occurred 
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
        console.log('body:', body); //Prints the response of the request. 
        handleCompanies(res, body, handlePrice)
    });
}

function getPrice(tickerSym, res, handlePrice) {
    request.get('https://trade-junky.appspot.com/getquote?name=' + tickerSym, function(error, response, body) {
        console.log('error:', error); // Print the error if one occurred 
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
        console.log('body:', body); //Prints the response of the request. 
        handlePrice(res, body)
    });
}

handlePrice = function(res, responseOutStr) {
    responseOut = JSON.parse(responseOutStr);
    res.setHeader('Content-Type', 'application/json'); //Requires application/json MIME type
    res.send(JSON.stringify({
        "speech": "Last price was " + responseOut.lastPrice,
        "displayText": responseOut.lastPrice
    }));
}

handleCompanies = function(res, responseOutStr, handlePrice) {
    responseOut = JSON.parse(responseOutStr);
    var response = "";
    var companyCount = Object.keys(responseOut).length;
    if (companyCount == 0) {
        res.setHeader('Content-Type', 'application/json'); //Requires application/json MIME type
        res.send(JSON.stringify({
            "speech": "There is no such companies",
            "displayText": "There is no such companies"
        }));

    }
    if (companyCount > 1) {
        for (var key in responseOut) {
            console.log("Key: " + key);
            console.log("Value: " + responseOut[key]);
            response = response + responseOut[key] + " or ";
        }
        response = response + "something else ?";
        res.setHeader('Content-Type', 'application/json'); //Requires application/json MIME type
        res.send(JSON.stringify({
            "speech": "Which one are you talking about " + response,
            "displayText": response
        }));

    } else {
        var tickerSym = Object.keys(responseOut)[0];
        getPrice(tickerSym, res, handlePrice);
    }
}


/**
 * Responds to any HTTP request that can provide a "message" field in the body.
 *
 * @param {!Object} req Cloud Function request context.
 * @param {!Object} res Cloud Function response context.
 */
exports.helloWorld = function helloWorld(req, res) {
    var intent = req.body.result.metadata.intentName
    if (intent == "Tell-Stocks") {
        var companyname = req.body.result.parameters.companyname;
        getCompanies(companyname, res, handleCompanies, handlePrice)
    } else if (intent == "Tell-Stocks - Tell Price") {
        var companyname = req.body.result.parameters.companyname;
        getCompanies(companyname, res, handleCompanies, handlePrice)
    } else {
        var p1 = req.body.result.parameters.insights;
        console.log(p1);
        responseOut = "LOL ! You are asking about " + p1; //Default response from the webhook to show it's working
        res.setHeader('Content-Type', 'application/json'); //Requires application/json MIME type
        res.send(JSON.stringify({
            "speech": responseOut,
            "displayText": responseOut
            //"speech" is the spoken version of the response, "displayText" is the visual version

        }));
    }
}

