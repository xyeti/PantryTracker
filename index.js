'use strict';
var Alexa = require('alexa-sdk');
var moment = require('moment');
var dbHelp = require('dbHelp.js');
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
        var timeList ={};
        var dbObj ={};
        var uName = this.event.session.user.userId;
        var un = uName.split('\.');

        console.log(un[3]);


        console.log('Storetype === '+ storeType);

        if(arrayState === '')
        {
            //Here is the parsed text file in an array for food reference
            var jsonArray = require("./foodKeeper_minimal.json");
            arrayState = 'ACTIVE';

        }

        if (jsonArray)
        {
            //Add user entries, date created etc. 
            dbObj['USERID'] = un[3];
            dbObj['dateCreated'] = moment();
            dbObj['foodItem'] = foodItem;
            dbObj['storeType'] = storeType;

            for(var i=0;i<jsonArray.maxRows;i++)
            {
                if(foodItem.toLowerCase() === jsonArray.data[i].Name.toLowerCase())
                {
                    console.log(`found the item ${foodItem} in the list`);
                    obj = jsonArray.data[i];
                    break;
                }
            }

            console.dir(JSON.stringify(obj,null),{depth:null, colors:true});
     
                        
            console.log(expDate);
            //timeList["storeType"]= storeType;

            // Expiry date is not provided by the user
            if (expDate === undefined)
            {
                // StoreType is not provided
                if(storeType === undefined)
                {
                    timeList = getListTimes(obj,objColsIndex);
                }
                //StoreType is provided
                else
                {
                    var sType = [storeType,'DOP_'+storeType];
                    //console.log(sType);
                    timeList = getListTimes(obj, sType);
                }
                
                // Time value store is obtained here...need to send it to database
                //database call...
                // console.log("Time from Time List=" + timeList);
            }
            else // expDate is given by the user
            {
                var now = moment();
                var duration = moment.duration(expDate);
                var newDate = now.add(duration);
                console.log('duration value = '+ newDate.format());
                //console.log('ISO string = '+ newDate.toISOString());

                timeList["userAdded"]=newDate;
            }
            console.dir(JSON.stringify(timeList,null),{depth:null,colors:true});

            for(var attName in timeList)
            {
                dbObj[attName] = timeList[attName];
            }
            
        } //jsonArray is valid
        
        console.dir(JSON.stringify(dbObj,null),{depth:null,colors:true});

        console.log("calling the DB ...");
        dbHelp.addFoodEntryDB(dbObj, (err, data)=>
        {
            if (!err)
            {
                console.dir('successfully added item to the db'+data);
            }
            else
            {
                console.dir('Issue adding item to the list');
            }

        });

        setTimeout(null, 3000);

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

function getListTimes(obj, arrayEntry)
{
    var now = moment();
    var timeValueStore={};

    for(var i=0; i<arrayEntry.length;i++)
    {
        var timeStore = getTimes(obj,arrayEntry[i]);
        console.log('Time returned ='+timeStore);

        // if time returned is not null
        if(timeStore)
        {
            var duration = moment.duration(timeStore);
            
            console.dir('Old Time = '+ now.format());
            var newDate = now.add(duration);

            console.dir('New Time = '+ newDate.format());
            timeValueStore[arrayEntry[i]] = newDate;

            console.log(arrayEntry[i]+'='+timeValueStore[arrayEntry[i]].format());
        }
    
    } //each entry in the array

    return timeValueStore;   
} //getListTimes


//Look at the object and return object with times for refrigerate 
function getTimes(obj, entryType)
{
    var timeObject = null;
    console.log('entryType='+entryType);

   //user gave a entry type in query
    if (entryType != null)
    {
        var str = entryType+"_Max";
        var metr = entryType+"_Metric";

        var strr = obj[str];
        var metrr = obj[metr];

      //  console.log('Entered here '+strr +' and '+metrr);

        //check if value is null. If not null convert to duration
        if (strr)
        {
            //console.log('Entered here--1'+strr);
            var metric = getDuration(metrr);
            timeObject = 'P'+strr+metric;
        }
    }
    //entryType is not provided. shouldnt come here at all.
    else{
        console.log('Error: EntryType is required to get value for expiry');
    }

    //console.log('TimeObject called in getTimes'+timeObject);

    //return null or timeobject value
    return timeObject;
}//getTimes

//get AMAZON.DURATION Value
function getDuration(metric)
{
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

    return dateValue;

} //getDuration