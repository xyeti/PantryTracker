

/*
* Helper functions
*/
function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: `SessionSpeechlet - ${title}`,
            content: `SessionSpeechlet - ${output}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}


/*
* Skill methods
*/

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = 'Welcome to Pantry Tracker skill';
    const speechOutput = 'Welcome to the Pantry Tracker skill. ' +
        'Please tell me what pantry item you want to track?';

    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'Please tell me the pantry item to track by saying, ' +
        'add blueberry to tracklist';
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function addItemForSession(intent, session, callback)
{
    console.log('intent='+ intent);
    console.log('session='+session);

    const sessionAttributes = {};
    const cardTitle = 'Adding item to the list';
    const speechOutput = 'Item added to the list with expiry 1 week. ' + 
                            'Is there any other item would you like to add?';
    const repromptText = 'Is there anything item would you like to add?'
    const shouldEndSession = false;

    var resp = buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession);
    //console.log(resp);

    callback(sessionAttributes,resp);   

}

/*--------------
   Event handler
--------------
*/
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;
    var userName = intentRequest.session.user.userId;
    console.log('User name='+userName);


    // Dispatch to your skill's intent handlers
    if (intentName === 'addItem') {
        addItemForSession(intent, session, callback);
    } 
/*
    else if (intentName === 'WhatsMyColorIntent') {
        getColorFromSession(intent, session, callback);
    } else if (intentName === 'AMAZON.HelpIntent') {
        getWelcomeResponse(callback);
    } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        handleSessionEndRequest(callback);
    } else {
        throw new Error('Invalid intent');
    }
    */
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here
}

//-----------------------------------------------------------
/*
 *  Main handler for the skill
 */
exports.handler = function (event, context, callback) {

 try {

        console.log(`application ID is event.session.application.applicationId=${event.session.application.applicationId}`);
//        console.log(event);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        
        if (event.session.application.applicationId !== 'amzn1.ask.skill.6922232e-c449-4b18-b8a6-ad699ef2182a') {
             callback('Invalid Application ID');
        }
        console.log('App invoked from is right');
        
        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });

        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    
                    var json_op = buildResponse(sessionAttributes,speechletResponse); 
                    console.log('inside callback='+ JSON.stringify(json_op,null,4));
                    callback(null, json_op);
                
                });
            
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback(null);
        }

    } catch (err) {
        callback(err);
    }
}