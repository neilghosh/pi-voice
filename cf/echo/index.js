const request = require('request');
const MAX_COMPANIES_IN_RESPONSE = 2;

function getCompanies(name, quoteType, res, handleCompanies, handlePrice) {
    request.get('https://trade-junky.appspot.com/companysearch?name=' + name, function(error, response, body) {
        console.log('error:', error); // Print the error if one occurred 
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
        console.log('body:', body); //Prints the response of the request. 
        handleCompanies(quoteType,res, body, handlePrice)
    });
}

function getPrice(tickerSym, quoteType, res, handlePrice) {
    request.get('https://trade-junky.appspot.com/getquote?name=' + tickerSym, function(error, response, body) {
        console.log('error:', error); // Print the error if one occurred 
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
        console.log('body:', body); //Prints the response of the request. 
        handlePrice(quoteType, res, body)
    });
}

handlePrice = function(quoteType, res, responseOutStr) {
    responseOut = JSON.parse(responseOutStr);
    res.setHeader('Content-Type', 'application/json'); //Requires application/json MIME type
    res.send(JSON.stringify({
        "speech": "Last price was " + responseOut['lastPrice'],
        "displayText": "<b>"+ responseOut.symbol +" : "+ responseOut.lastPrice + " INR</b>" 
    }));
}

handleCompanies = function(quoteType,res, responseOutStr, handlePrice) {
    responseOut = JSON.parse(responseOutStr);
    var response = "";
    var companyCount = Object.keys(responseOut).length;
    if (companyCount == 0) {
        res.setHeader('Content-Type', 'application/json'); //Requires application/json MIME type
        res.send(JSON.stringify({
            "speech": "Sorry never heard of this company registered in NSE. Say it again please.",
            "displayText": "Sorry never heard of this company registered in NSE. Say it again please."
        }));

    }
    if (companyCount > 1) {
        var count = 0;
        var companyNames = [];
        for (var key in responseOut) {
            companyNames.push(responseOut[key]);
            if(++count >= MAX_COMPANIES_IN_RESPONSE){
                break;
            }
        }
        response = companyNames.join(', ')+" or something else?";;
        res.setHeader('Content-Type', 'application/json'); //Requires application/json MIME type
        res.send(JSON.stringify({
            "speech": "Which company are you talking about? " + response,
            "displayText": response
        }));

    } else {
        var tickerSym = Object.keys(responseOut)[0];
        getPrice(tickerSym, quoteType, res, handlePrice);
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
    if (intent == "Tell-Stocks" || intent == "Tell-Stocks - Tell Price") {
        var companyname = req.body.result.parameters.companyname;
        var quoteType = req.body.result.parameters.quotetype
        getCompanies(companyname, quoteType, res, handleCompanies, handlePrice)
    } else {
        var p1 = req.body.result.parameters.insights;
        console.log(p1);
        responseOut = "You have asked about " + p1 + " but no information found."; //Default response from the webhook to show it's working
        res.setHeader('Content-Type', 'application/json'); //Requires application/json MIME type
        res.send(JSON.stringify({
            "speech": responseOut,
            "displayText": responseOut
            //"speech" is the spoken version of the response, "displayText" is the visual version
        }));
    }
}

