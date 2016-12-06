var AWS = require("aws-sdk");
AWS.config.update({
region: "us-west-2",
endpoint: "http://localhost:8000"
});


var params = {
TableName : "PantryTracker",
KeySchema: [
	{ AttributeName: "USERID", KeyType: "HASH"}, //Partition key
	{ AttributeName: "DateCreated", KeyType: "RANGE" } //Sort key
	],
	AttributeDefinitions: [
	{ AttributeName: "USERID", AttributeType: "S" },
	{ AttributeName: "DateCreated", AttributeType: "N" }
	],
	ProvisionedThroughput: {
	ReadCapacityUnits: 10,
	WriteCapacityUnits: 10
	}
};

var dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

dynamodb.createTable(params, (err,data)=>
{
	if(!err)
	{
		console.log('Table successfully created');
		console.log("Created table. Table description JSON:",JSON.stringify(data, null, 2));
	}
	else
	{
		console.log('error in creating table');
	}
});


function addFoodEntryDB(obj, callback)
{
	var params = {
		TableName:'PantryTracker',
		Item:obj
	};

	if(docClient)
	{
		docClient.put(params, callback);
	}

}