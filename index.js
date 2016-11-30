'use strict';
var Alexa = require('alexa-sdk');
var moment = require('moment');
//var dynamoDb =require ('dynamodb-local');



var statemachine = { 
    onBoardingState: '',
    initializationComplete:'',
    activeListening:'',
    endSession:''
};

var APP_ID = "amzn1.ask.skill.6922232e-c449-4b18-b8a6-ad699ef2182a"; 
var SKILL_NAME = 'Pantry Tracker';

var arrayState = '';

/**
 * Array containing Pantry items, expiry and refrigeration status
 */
var ITEMS;

var objColsIndex = ['Pantry','DOP_Pantry','Refrigerate','DOP_Refrigerate','Freeze','DOP_Freeze'];

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

var handlers = {

    // Launch request: skill is invoked with no parameters
    'LaunchRequest': function () {
        this.emit('AMAZON.HelpIntent');
    },

    'addItem': function () { // adding an item to the list
        
        var foodItem = this.event.request.intent.slots.foodItem.value;
        var expDate = this.event.request.intent.slots.expDate.value;
        var storeType = this.event.request.intent.slots.storeType.value;
        var obj;

        if(arrayState === '')
        {
            //Here is the parsed text file in an array for food reference
            var jsonArray = require("./foodKeeper_minimal.json");
            arrayState = 'ACTIVE';
        }

        if (jsonArray)
        {
            for(var i=0;i<jsonArray.maxRows;i++)
            {
                if(foodItem.toLowerCase() === jsonArray.data[i].Name.toLowerCase())
                {
                    console.log(`found the item ${foodItem} in the list`);
                    obj = jsonArray.data[i];
                    break;
                }
            }


            var now = moment();
                        
            console.log(expDate);

            // Expiry date is not provided by the user
            if (expDate === undefined)
            {
                // StoreType is not provided
                if(StoreType === undefined)
                {
                    for(i=0;i<objColsIndex.length;i++)
                    {
                        var timeStore = getTimes(obj,objColsIndex[i]);
                        var duration = moment.duration(timeStore.duration);
                        
                        console.dir('Old Time = '+ now.format());
                        var newDate = now.add(duration);
                        console.dir('New Time = '+ newDate.format());
                    }
                }
                //StoreType is provided
                else
                {
                    //Need to add code for specific storetype

                }
                             

                //console.log("Time from TiemStore=" + timeStore['duration']);
               
            }
            else
            {
                var duration = moment.duration(expDate);
                var newDate = now.add(duration);
                console.log('duration value = '+ newDate.format());
                console.log('ISO string = '+ newDate.toISOString());
            }
            
        } //jsonArray is valid

        //Speech output 
        var speechOutput = `${foodItem} added to yor list. Do you like to add anything else?`;
        var reprompt = "Do you like to add anything else?";
        var content = `Item ${foodItem} added to the list with expiry ${expDate}`;

        this.emit(':askWithCard', speechOutput, reprompt, SKILL_NAME,content);
    },
    'AMAZON.HelpIntent': function () {
        var speechOutput = "You can ask me to add, delete or update a food item and its expiry date for your pantry";
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

//Look at the object and return object with times for refrigerate 
function getTimes(obj, entryType)
{
    var timeObj ={};
    console.dir(JSON.stringify(obj,null),{depth:null, colors:true});

    console.log('obj.Refrigerate_Min='+obj.Refrigerate_Min);

    if((obj['Refrigerate_Min'] != 'null') && (obj['DOP_Refrigerate_Min'] != 'null'))
    {

        console.log('came here');

        var metric;
        var max;
        if(obj['Refrigerate_Min'])
        {
            metric = obj['Refrigerate_Metric'];
            max = obj['Refrigerate_Max'];
        }
        else
        {
            metric = obj['DOP_Refrigerate_Metric'];
            max = obj['DOP_Refrigerate_Max'];
        }

        
        var dateValue;
            
        console.log(metric.toLowerCase());


        if(metric.toLowerCase() =='weeks')
        {
            dateValue = 'W';
        }
        else if (metric.toLowerCase() =='months')
        {
            dateValue = 'M';
        }
        else if (metric.toLowerCase() =='years')
        {
            dateValue = 'Y';
        }
        else if (metric.toLowerCase() == 'days')
        {
            dateValue = 'D';
        }
        else
        {
            dateValue ='';
        }

        //convert the time into duration and return the time
        timeObj.duration = 'P'+max+dateValue;
        console.log('new TimeObj value='+timeObj.duration);
    }

    if((obj['DOP_Refrigerate_Min'] === 'null') && (obj['Refrigerate_Min'] === 'null'))  
    {
           console.log('item not refrigeratable');

    }

    console.log('timeObj = '+timeObj.duration);
    return timeObj;
}

//function get