'use strict';

var userName = 'amzn1.ask.account.AGMPJGLV3KK5AMXQDIIHLGISVFMO5KRCBHJLCM5QCHOAI5V6R22JGVF5B6TFXZDXRMX5GTIE2ANPI373YIJXN43XORR66XEJQ4EBFW4XGQPSKSIO6M4HXNBO4XEVHX4S6J7MWDPMEOGJDWP46FM5WDEIIV3N3FI77XNKBZOS7JHK3X673RYOOYWBH4LRKH6NUDVHE6YBR7IU36Y';

//var acntRegEx = /amzn1\.ask\.account\.(*)/;


var accntName = userName.split('\.');

//console.log(accntName[3]);

var contents = require('fs');
var jsonArray = require("./foodKeeper_minimal.json");
//var foodArray = contents.readFileSync('fk.json');
//var jsonArray = JSON.parse(foodArray);


for( var jA in jsonArray.data)
{
	console.log(jsonArray.data[jA].Name);
	console.log("Can be consumed if refrigerated from purchase for "+ jsonArray.data[jA].DOP_Refrigerate_Min+ " to " + 
		jsonArray.data[jA].DOP_Refrigerate_Max+" "+ jsonArray.data[jA].DOP_Refrigerate_Metric);
}
