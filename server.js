(function () {
    "use strict";
	var express = require('express'),
		app = express(),
		sqlite3 = require('sqlite3').verbose(),
		http = require('http'),
		db = new sqlite3.Database('./static/database.db');
		

	app.configure(function () {
		app.set('port', process.env.PORT || 3000);
		//app.enable('view cache');

		//error handling	
		app.use(function (err, req, res, next) {
			console.error(err.stack);
			res.send(500, 'Error :' + err.stack);
		});

		app.set('view engine', 'ejs');
		app.use('/static', express.static(__dirname + "/static"));

		app.get('/', function (req, res) {
			res.redirect('/static/');
		});

		app.get('/api/query', function (req, res) {					
			//QUERY FOR LIST OF OPPORTUNITIES: /api/query/?q=SELECT%20*%20FROM%20HOC__Volunteer_Opportunity__c&start=5
			//QUERY FOR RESULTS PAGE: /api/query/?q=SELECT%20*%20FROM%20HOC__Occurrence__c%20WHERE%20HOC__Volunteer_Opportunity__c%3D%27a0NA0000004mq1qMAA%27
			//QUERY FOR START DATE, END DATE, other searches: 
			
			//NOTE: In production version, will need to rely on salesforce "next Records" URL instead
			var start = 0;
			var limit = 10; //max results returned per request - TODO: UP THIS LATER
			
			if(req.query.start != undefined){
				start = parseInt(req.query.start);
			}
			
			if(req.query.q != undefined){
				console.log("Executing query: " + req.query.q);
				
				db.all(req.query.q, function(err, rows) {
				
					if (err != undefined){
						res.send(err);
					} else {
					
						console.log("Found rows: " + rows.length);
						
						var result = {};
						
						//assign properties based on salesforce api doc - "Execute a SOQL Query" - https://www.salesforce.com/us/developer/docs/api_rest/
						result.done = true;
						result.totalSize = rows.length;
						result.records = rows.slice(start, start + limit);		
						res.send(result);	
					}
				});				
			}					
		});
	});
	
	
	
	/*
	var triggerCsvRead = function (filename) {
		console.log("Loading " + filename + " ...");
		
		//Converter Class
		var Converter=require("csvtojson").core.Converter;

		//CSV File Path or CSV String or Readable Stream Object
		var csvFileName="./static/" + filename + ".csv";

		//new converter instance
		var csvConverter=new Converter();

		//end_parsed will be emitted once parsing finished
		csvConverter.on("end_parsed",function(jsonObj){

			data[filename] = jsonObj.csvRows; //here is your result json object
			console.log("Populated object from " + filename);
		});

		//read from file
		csvConverter.from(csvFileName);	
	}*/

	http.createServer(app).listen(app.get('port'), function () {
		console.log("Express server listening on port " + app.get('port'));
		
		//NO LONGER NEED SINCE USING SQLITE3
		//triggerCsvRead("HOC__Volunteer_Opportunity__c");
		//triggerCsvRead("HOC__Occurrence__c");			
	});
}()); //end of anonymous executing function