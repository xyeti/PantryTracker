'use strict';
var Alexa = require('alexa-sdk');
//var dynamoDb =require ('dynamodb-local');

var APP_ID = "amzn1.ask.skill.6922232e-c449-4b18-b8a6-ad699ef2182a"; 
var SKILL_NAME = 'Pantry Tracker';

var status = 'not active';

/**
 * Array containing Pantry items, expiry and refrigeration status
 */
var ITEMS;


exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {
    'LaunchRequest': function () {
        this.emit('AMAZON.HelpIntent');
    },

    'addItem': function () { // adding an item to the list

        if (status == 'not active')
        {
            var jsonArray = require('./foodKeeper_minimal.json');
            status = 'ACTIVE'; 
        }

        console.log(jsonArray.data[10].Name);

        var foodItem = this.event.request.intent.slots.foodItem.value;
        var expDate = this.event.request.intent.slots.expDate;

        if (expDate === undefined)
        {
            expDate = '1 week';
        }
    
        //Speech output 
        var speechOutput = `${foodItem} added to yor list. Do you like to add anything else?`;
        var reprompt = "Do you like to add anything else?";
        var content = `Item ${foodItem} added to the list with expiry ${expDate}`;

        this.emit(':askWithCard', speechOutput, reprompt, SKILL_NAME,content);

    },
    'AMAZON.HelpIntent': function () {
        var speechOutput = "You can ask me to add/delete/update a list of food items and their expiry date";
        var reprompt = "What can I help you with?";
        this.emit(':ask', speechOutput, reprompt);
    },
    'AMAZON.CancelIntent': function () {
        this.emit(':tell', 'Thanks for trying the Pantry Tracker. Good Bye!');
    },
    'AMAZON.StopIntent': function () {
        this.emit(':tell', 'Thanks for trying the Pantry Tracker. Good Bye!');
    }
};