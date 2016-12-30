'use strict';

var Alexa = require('alexa-sdk');
var moment = require('moment');
var dbHelp = require('dbHelp.js');
var dynamoDb =require ('dynamodb-local');



var statemachine = { 
    onBoardingState: '',
    initializationComplete:'',
    activeListening:'',
    endSession:''
};

var APP_ID = "amzn1.ask.skill.6922232e-c449-4b18-b8a6-ad699ef2182a"; 
var SKILL_NAME = 'Pantry Tracker';

var arrayState = '';

var expDateNormal = "True";

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

    //TODO: Move addItem function to a seperate file
    'addItem': function () { // adding an item to the list

        var foodItem = this.event.request.intent.slots.foodItem.value;
        var expDate = this.event.request.intent.slots.expDate.value;
        var storeType = this.event.request.intent.slots.storeType.value;

        var eventObj = this.event;
        var mythis = this;
        console.dir(JSON.stringify(this,null),{depth:null,colors:true});

        //var storeType = 'Freeze';
        var obj;
        var timeList ={};
        var dbObj ={};
        var uName = this.event.session.user.userId;
        var un = uName.split('\.');

        console.log(un[3]);


        console.log('Storetype === '+ storeType);
        
        //Add check to see if inputs are good
        //If foodItem is null then return here itself

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
            dbObj['DateCreated'] = moment().get('Year')+'-'+moment().get('Month')+'-'+moment().get('Date');
            dbObj['foodItem'] = foodItem;
            dbObj['storeType'] = storeType;

            //console.log('Date='+ dbObj['DateCreated']);
            //TODO: Move this to a seperate function
            for(var i=0;i<jsonArray.maxRows;i++)
            {
                if(foodItem.toLowerCase() === jsonArray.data[i].Name.toLowerCase())
                {
                    console.log(`found the item ${foodItem} by Name`);
                    obj = jsonArray.data[i];
                    break;
                }//main name
                // food item is not found in the name but it is present in the name_subtitle parameter
                else if (jsonArray.data[i].Name_subtitle != null)
                {

                    //console.log('ST = '+ jsonArray.data[i].Name_subtitle);
                    
                    var nameSub = jsonArray.data[i].Name_subtitle.toLowerCase();
                    var subtitle = nameSub.split(',');
                    //console.log("ST len = "+ subtitle.length);
                    
                 
                    for (var q=0; q<subtitle.length;q++)
                    {
                        //console.log(subtitle[q]);
                        if (foodItem.toLowerCase() === subtitle[q])
                        {
                            console.log(`found the item ${foodItem} from name_subtitle`);
                            obj = jsonArray.data[q];
                        }
                    }
                 
                }//subtitle
                
            }//for list items in jsonarray
                       
            //console.log("Expiry date coming from request = "+ expDate);
            //timeList["storeType"]= storeType;

            //TODO: move expiryDate finder to a function    
            // Expiry date is not provided by the user
            if (expDate === undefined)
            {
                // if ExpiryDate is not given by user then we need to find it from the JsonArray
                // If JsonArray didnt return an object then we will need user guidance on expiryDate
                // Prompt response back to the user
                if (obj != null)
                {
                    console.dir(JSON.stringify(obj,null),{depth:null, colors:true});
                }
                else
                {
                  var speechOutput = `How long would you like to store the ${foodItem}?`;
                  var reprompt = "Please specify an expiry date";
                  var content = `Please specify an expiry date for the ${foodItem}`;

                  this.emit(':askWithCard', speechOutput, reprompt, SKILL_NAME,content);
                }

                // StoreType is not provided
                if(storeType === undefined)
                {
                    timeList = getListTimes(obj,objColsIndex);
                    if(timeList)
                    {
                        for(var attName in timeList)
                         {
                            dbObj['exp_'+attName] = timeList[attName].format('YYYY-MM-DD');
                         }

                        //console.dir("Yp3..."+JSON.stringify(timeList,null),{depth:null,colors:true});
                        var unixtime = getExpiryFromList(timeList);
                        dbObj['expDate'] = Math.floor(moment(unixtime).unix()/1000);
                        console.log("unixtime="+dbObj['expDate']);

                    } //if Value of timelist is not null
                    else
                    {
                        //Found an object with name but timelist is null???
                        //Send response to user asking for more info.
                        var speechOutput = `How long would you like to store the ${foodItem}?`;
                        var reprompt = "Please specify an expiry date";
                        var content = `Please specify an expiry date for the ${foodItem}`;
                        this.emit(':askWithCard', speechOutput, reprompt, SKILL_NAME,content);

                        //Will need to package the current work so that we can continue from user response
                        //Next steps
                    }
                   
                }
                //StoreType is provided
                else
                {
                    var sType = [storeType,'DOP_'+storeType];
                    //console.log(sType);
                    timeList = getListTimes(obj, sType);

                    var dVal;
                    console.dir("Yp..."+JSON.stringify(timeList,null),{depth:null,colors:true});    

                    if (timeList)
                    {
                        var objArr = Object.keys(timeList);
                         dVal = timeList[objArr[0]];
                         dbObj['exp_'+objArr[0]] = dVal.format('YYYY-MM-DD');
                        
                        /*         
                        if (timeList[0] == "null")
                        {
                            dVal = timeList[sType[0]];
                            dbObj['exp_'+sType[1]] = dVal.format('YYYY-MM-DD');
                            
                        }
                        else
                        {
                           dVal = timeList[sType[0]];
                           dbObj['exp_'+sType[0]] = dVal.format('YYYY-MM-DD');
                        }*/


                        //console.log('value here is what#1???'+dVal.format('YYYY-MM-DD'));
                        //console.log('value here is what???'+ moment(dVal).get('Year')+'-'+moment(dVal).get('Month')+'-'+moment(dVal).get('Date'));
                        //dbObj['expDate'] = moment(dVal).get('Year')+'-'+moment(dVal).get('Month')+'-'+moment(dVal).get('Date');
                        //dbObj['expDate'] = dVal.format('YYYY-MM-DD');

                        console.log("dVal = "+dVal);
                        dbObj['expDate'] = Math.floor(moment(dVal).unix()/1000);
                        
                        //var unixtime = moment(dbObj[expDate]).unix()/1000;
                        console.log("unixtime="+dbObj['expDate']);
                    }
                    else
                    {
                        //Found an object with name but timelist is null???
                        //Send response to user asking for more info.
                        var speechOutput = `How long would you like to store the ${foodItem}?`;
                        var reprompt = "Please specify an expiry date";
                        var content = `Please specify an expiry date for the ${foodItem}`;
                        this.emit(':askWithCard', speechOutput, reprompt, SKILL_NAME,content);

                        //Will need to package the current work so that we can continue from user response
                        //Next steps
                    }
                
                }//storeType is provided by user

            } //expiryDate not given by user
            else 
            {
                // expDate is given by the user
                var now = moment();
                var duration = moment.duration(expDate);
                var newDate = now.add(duration);

                //console.log('date user specified = '+ newDate);
                console.log('duration value specified by user = '+ newDate.format("YYYY-MM-DD"));
                
                timeList["userAdded"]=newDate.format("YYYY-MM-DD");
                //dbObj['expDate'] = newDate.format("YYYY-MM-DD");

                dbObj['expDate'] = Math.floor(moment(newDate).unix()/1000);
                dbObj['exp_userAdded'] = timeList['userAdded'];
            }
            //console.dir("Yp..."+JSON.stringify(timeList,null),{depth:null,colors:true});

        } //jsonArray is valid
        
        console.dir(JSON.stringify(dbObj,null),{depth:null,colors:true});
        //console.dir(dbObj);

        //Success...Linear progress...found obj in list, found expDates and items

        console.log("calling the DB ...");
        postDB(dbObj,eventObj,mythis);

    },
    'getItem': function()
    {
        var foodItem = this.event.request.intent.slots.foodItem.value;
        var expDate = this.event.request.intent.slots.expDate.value;
        var uName = this.event.session.user.userId;
        var USERID = uName.split('\.');

        var dbObj={};
        dbObj['USERID'] = USERID;

        
        //retriving expiry for food items by name and time
        if (expDate)
        {
            //Query with the user id
            var now = moment();
            var duration = moment.duration(expDate);
            
            console.dir('Old Time = '+ now.format());
            var newDate = now.add(duration);
            console.log('New Time = '+ Math.floor(newDate/1000000));
          

        }
        else
        {
            //else Expiry date is not given by user. Assume it is today
            var date = Math.floor(moment().unix()/1000);
            console.log('New Time = '+ JSON.stringify(date,null));
             
            
        }

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
    var timeValueStore={};
    

    for(var i=0; i<arrayEntry.length;i++)
    {
        //console.log("getListtimes: Val sent is "+i+" and "+arrayEntry[i]);
        var timeStore = getTimes(obj,arrayEntry[i]);
        //console.log('Time returned in getListTimes='+timeStore);

        // if time returned is not null
        if(timeStore)
        {
            var now = moment();
            var duration = moment.duration(timeStore);
            
          //  console.dir('Old Time = '+ now.format());
            var newDate = now.add(duration);
           //console.log('New Time = '+ newDate);

            timeValueStore[arrayEntry[i]] = newDate;
            
            //console.log(arrayEntry[i]+': value currently in timeValueStore'+timeValueStore[arrayEntry[i]].format());
            //console.dir("Array value now "+JSON.stringify(timeValueStore,null),{depth:null,colors:false});            
        }
    
    } //each entry in the array

   //console.dir(JSON.stringify(timeValueStore,null),{depth:null,colors:false});
   //console.dir("timeValueStore =" + timeValueStore);
    return timeValueStore;   
} //getListTimes


//Look at the object and return object with times for refrigerate 
function getTimes(obj, entryType)
{
    var timeObject = null;
    //console.log('entryType='+entryType);

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
            
    //console.log(metric.toLowerCase());

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


// Entries are : 'Pantry','DOP_Pantry','Refrigerate','DOP_Refrigerate','Freeze','DOP_Freeze'
// Order of priority: Refrigerate, DOP_Refrigerate,Pantry, DOP_PAntry, Freeze, DOP_Freeze

function getExpiryFromList(list)
{
    var min;
    if (list['Refrigerate'] != null)
    {
        min = list['Refrigerate'];
    }
    else if (list['DOP_Refrigerate'] != null)
    {
        min = list['Refrigerate'];   
    }
    else if (list['Pantry'] != null)
    {
        min = list['Pantry'];   
    }
    else if (list['DOP_Pantry'] != null)
    {
        min = list['Pantry'];   
    }
    else if (list['Freeze'] != null)
    {
        min = list['Freeze'];   
    }
    else
    {
        min = list['DOP_Freeze'];
    }

    //return min.format('YYYY-MM-DD');
    return min;
}

function postDB (dbObject, eventObj, mythis)
{
    //TODO: check if table is present
    //Generally dont have to check...
    var foodItem = eventObj.request.intent.slots.foodItem.value;
    var expDate = dbObject.expDate;
 
    dbHelp.addFoodEntryDB(dbObject, (err, data)=>
    {

        //console.dir('eventObject=' + JSON.stringify(eventObj,null),{depth:null,colors:false});

     //   var foodItem = reqObj.event.request.intent.slots.foodItem.value;
            if (!err)
            {
                console.dir('successfully added item to the db'+JSON.stringify(data,null));
                //Speech output 
                var speechOutput = `${foodItem} added to yor list. Do you like to add anything else?`;
                var reprompt = "Do you like to add anything else?";
                var content = `Item ${foodItem} added to the list with expiry ${expDate}`;

                mythis.emit(':askWithCard', speechOutput, reprompt, SKILL_NAME,content);
            }
            else
            {
                console.dir('Issue adding item to the list '+ err);
            }

            
    } //callback
    );
}


