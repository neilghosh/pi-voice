const request = require('request');
const MAX_COMPANIES_IN_RESPONSE = 2;

function getCompanies(name, quoteType, res, handleCompanies, handlePrice) {
    var options = {
      url: 'https://trade-junky.appspot.com/api/companysearch?name=' + name,
      headers: {
      'api-key': '2246696acd8638f0fbfe5d6e4d515a3eaefed5c19b5a2c18'
      }
    };
    
    request.get(options, function(error, response, body) {
        console.log('error:', error); // Print the error if one occurred 
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
        console.log('body:', body); //Prints the response of the request. 
        handleCompanies(quoteType,res, body, handlePrice);
    });
}

function getPrice(tickerSym, quoteType, res, handlePrice) {
    var options = {
      url: 'https://trade-junky.appspot.com/api/getquote?name=' + tickerSym,
      headers: {
      'api-key': '2246696acd8638f0fbfe5d6e4d515a3eaefed5c19b5a2c18'
      }
    };
    request.get(options, function(error, response, body) {
        console.log('error:', error); // Print the error if one occurred 
        console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received 
        console.log('body:', body); //Prints the response of the request. 
        handlePrice(quoteType, res, body);
    });
}

handlePrice = function(quoteType, res, responseOutStr) {
    responseOut = JSON.parse(responseOutStr);
    var quote = "";
    if(quoteType in responseOut){
        quote =  responseOut[quoteType];
    } else {
        quote = responseOut["lastPrice"] + " INR";
    }
    res.setHeader('Content-Type', 'application/json'); //Requires application/json MIME type
    res.send(JSON.stringify({
        "speech": "It is " + quote +"",
        "displayText": ""+ responseOut.symbol +" : "+ quote+""
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
exports.stockTellerWebHook = function stockTellerWebHook(req, res) {
    console.log(req.body.result.parameters);
    var intent = req.body.result.metadata.intentName
    if (intent == "Tell-Stocks" || intent == "Tell-Stocks - Tell Price" || intent == "Tell-Stocks - Tell Price - Tell Quote" ) {
        var companyname = req.body.result.parameters.companyname;
        var quoteType = req.body.result.parameters.quotetype;
        console.log("Webhook received companyname: " + companyname + " quoteType: " + quoteType );
        if(intent == "Tell-Stocks - Tell Price - Tell Quote") {
            var companyname_new = req.body.result.parameters.companyname_new;
            var quoteType_new = req.body.result.parameters.quotetype_new;
            companyname = companyname_new == '' ? companyname :  companyname_new;
            quoteType = quoteType_new == '' ? quoteType : quoteType_new;
        }
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

