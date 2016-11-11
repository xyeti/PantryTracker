var AWS = require("aws-sdk");
AWS.config.update({
region: "us-west-2",
endpoint: "http://localhost:8000"
});

var dynamodb = new AWS.DynamoDB();
var tableStatus ={
	name:'',
	status:''
};


function createTable(TableName, params, callback)
{

	var new_params = {
		TableName : `${TableName}`
	};
	var tableList;
	console.log('going to check table');
	
	 checkTable(TableName, (tableStatus)=>{
	 	console.dir('Inside createTable callback'+tableStatus.name+tableStatus.status);
	 	if (tableStatus.status === 'ACTIVE')
	 	{
	 		console.log('#22 Table already present');
	 		callback(null, tableStatus);
	 	}
	 	else
	 	{
	 		console.log('Table not there..starting new');
	 		dynamodb.createTable(params, callback);
	 	}
	 });	
};

function checkTable(TableName, callback)
{
	dynamodb.listTables({},(err, data)=>{
		console.log('inside list table cb');
		if (err)
		{
			console.error(err);
		}
		else
		{	
			tableList = data.TableNames;
			console.log('inside list table --1');
			if(tableList)
			{
				console.log('inside list table--2'+tableList);
				tableList.forEach((item)=>{
					if (item == TableName)
					{
						console.log('Table present; exit');
						tableStatus.name = TableName;
						tableStatus.status = 'ACTIVE';
						console.dir('3355 Inside checkTable callback '+tableStatus.name+tableStatus.status);
					}
									
				});
				console.dir('333 Inside checkTable callback '+tableStatus.name+tableStatus.status);
				callback(tableStatus);
			}
	
		} });
}


var params = {
TableName : "saaapadu",
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

/*
dynamodb.describeTable(new_params, (err,data)=>{
	if (err) 
	{
		console.dir(err);
		dynamodb.createTable(params, function(err, data) {
		if (err) {
			console.error("Unable to create table. Error JSON:",
			JSON.stringify(err, null, 2));
		} else {
			console.log("Created table. Table description JSON:",
			JSON.stringify(data, null, 2));
		}
});

	}
	else
	{
		console.dir(data.Table.TableName);
		console.dir(data.Table.TableStatus);
		if((data.Table.TableName === `${TableName}`) && (data.Table.TableStatus === 'ACTIVE'))
		{
			console.log('Table already present, no need to create a table');
			return;
		}

	}
});

}
*/
createTable('saaapadu', params, (err, data)=>{

	if(!err)
	{	console.log('Table created');
		console.dir(data);
		tableStatus.status = 'ACTIVE';
		tableStatus.name = 'saapadu';
	}
	else
	{
		console.log('Error creating table');
		console.dir(err);
	}
});