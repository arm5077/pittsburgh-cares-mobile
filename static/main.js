/* UTILITY FUNCTIONS */
function queryDB($http, queryString, responseFunction){
	console.log("Sending query: " + queryString);
	$http.get('/api/query/?q=' + encodeURIComponent(queryString)).then(responseFunction);
}

function removeHtml(text){
	return text.replace(/<(?:.|\n)*?>/gm, '');
}

function trim(text){
	var maxChars = 300;
	if (text.length > maxChars){
		text = text.substring(0, maxChars) + " ...";
	}
	
	return text;
}

function mapOccurrence(record, location, $filter){
	occurrence = {};
	
	occurrence.name = record.Name;
	occurrence.startDateTime = new Date(record.HOC__Start_Date_Time__c.split(" ").join("T"));
	occurrence.dayString = $filter('date')(occurrence.startDateTime, 'M/d');
	occurrence.timeString = $filter('date')(occurrence.startDateTime, 'shortTime'); //TODO: Make time format hipster by parsing string after - drop minutes if 00 and make AM/PM lower case
	
	occurrence.location = location; //TODO - future: Update for occurrence-specific location
	occurrence.totalSeats = record.HOC__Maximum_Attendance__c;
	occurrence.remainingSeats = parseInt(record.HOC__Maximum_Attendance__c) - parseInt(record.HOC__Total_Confirmed__c);
	if(occurrence.remainingSeats < 0){
		occurrence.remainingSeats = 0; //don't let remaining seats be negative one - event must have overbooked
	}
	occurrence.leader = record.HOC__Volunteer_Coordinator_Name__c;
	occurrence.email = record.HOC__Volunteer_Coordinator_Email__c;
	occurrence.opportunityUrl = record.HOC__Occurrence_URL__c;
	occurrence.id = record.Id;
	occurrence.opportunityId = record.HOC__Volunteer_Opportunity__c;
	return occurrence;
}


/* END UTILITY FUNCTIONS */

var pcm = angular.module('pcm', ['ngRoute']).run(function() {
	FastClick.attach(document.body); //eliminate 300 millisec wait after click on phones
  });
  
  pcm.config(['$routeProvider',
	function($routeProvider) {
	$routeProvider.
	  when('/search', {
		templateUrl: 'partials/search.html',
		controller: 'SearchCtrl'
	  }).
	  when('/opportunity/:opportunityId', {
		templateUrl: 'partials/opportunity-detail.html',
		controller: 'OpportunityDetailCtrl'
	  }).
	  when('/signup/:occurrenceId', {
		templateUrl: 'partials/signup.html',
		controller: 'SignupCtrl'
	  }).
	  when('/login/:occurrenceId', {
		templateUrl: 'partials/login.html',
		controller: 'SignupCtrl'
	  }).
	  when('/confirmed/:occurrenceId', {
		templateUrl: 'partials/confirmed.html',
		controller: 'SignupCtrl'
	  }).
	  otherwise({
		redirectTo: '/search'
	  });
  }]);
  
  pcm.controller('SignupCtrl', function($scope, $http, $routeParams, $filter, $location) {
	var populateOccurrenceData = function(occurrenceId) {
		var queryString = "SELECT HOC__Occurrence__c.Id, HOC__Occurrence__c.HOC__Volunteer_Opportunity__c, HOC__Volunteer_Opportunity__c.HOC__City_Text__c, HOC__Volunteer_Opportunity__c.Name, HOC__Volunteer_Opportunity__c.HOC__Description__c, HOC__Occurrence__c.HOC__Start_Date_Time__c, HOC__Occurrence__c.HOC__Occurrence_URL__c, HOC__Occurrence__c.HOC__Volunteer_Opportunity__c FROM HOC__Occurrence__c INNER JOIN HOC__Volunteer_Opportunity__c ON HOC__Occurrence__c.HOC__Volunteer_Opportunity__c = HOC__Volunteer_Opportunity__c.Id WHERE HOC__Occurrence__c.Id = '" + occurrenceId + "'";
		queryDB($http, queryString, function(response) {		
			var record = response.data.records[0];
			$scope.occurrence = mapOccurrence(record, "Pittsburgh", $filter);
			$scope.shareMessage = "I just signed up to help out " + $scope.occurrence.name + " on " + $scope.occurrence.dayString + "! Come join me!";
		});
	};
	
	$scope.submitAccount = function(){
		$scope.account;
		$location.path("/confirmed/" + $scope.occurrence.id);
	};
	
	$scope.shareOnFacebook = function(){			
		window.location.replace('http://www.facebook.com/sharer.php?s=100&p[title]='+encodeURIComponent("I'm volunteering at " + $scope.occurrence.name) + '&p[summary]=' + encodeURIComponent($scope.shareMessage) + '&p[url]=' + encodeURIComponent($scope.occurrence.opportunityUrl));
	};
	
	$scope.shareOnTwitter = function(){			
		window.location.replace("https://twitter.com/intent/tweet?text=" + encodeURIComponent($scope.shareMessage) + ":&:tw_p=tweetbutton&url=" + encodeURIComponent($scope.occurrence.opportunityUrl));
	};
	
	$scope.generateICal = function(){
		msgData1 = $filter('date')($scope.occurrence.startDateTime,"yyyyMMdd'T'HHmmss");
		msgData2 = $filter('date')($scope.occurrence.startDateTime.setHours($scope.occurrence.startDateTime.getHours() + 1),"yyyyMMdd'T'HHmmss");
		msgData3 = $scope.occurrence.location;
		msgData4 = $scope.occurrence.name;

		var icsMSG = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Our Company//NONSGML v1.0//EN\nBEGIN:VEVENT\nUID:me@google.com\nDTSTAMP:20120315T170000Z\nATTENDEE;CN=My Self ;RSVP=TRUE:MAILTO:me@gmail.com\nORGANIZER;CN=Me:MAILTO::me@gmail.com\nDTSTART:" + msgData1 +"\nDTEND:" + msgData2 +"\nLOCATION:" + msgData3 + "\nSUMMARY:" + msgData4 + "\nEND:VEVENT\nEND:VCALENDAR";

		window.open( "data:text/calendar;charset=utf8," + escape(icsMSG));
	}
	
	var init = function() {	  
		populateOccurrenceData($routeParams.occurrenceId);
	};	
	
	init();
  });

  pcm.controller('OpportunityDetailCtrl', function($scope, $http, $routeParams, $filter) {
	
	var pullOpportunityDetail = function(opportunityId){
	
		var opportunityQueryString = "SELECT * FROM HOC__Volunteer_Opportunity__c WHERE Id = '" + opportunityId + "'";
		
		queryDB($http, opportunityQueryString, function(response) {		
			var opportunity = response.data.records[0];
			$scope.name = opportunity.Name;
			$scope.orgName = ""; //TODO: Figure out where to pull this from
			$scope.description = removeHtml(opportunity.HOC__Description__c);
			$scope.category = opportunity.HOC__Primary_Impact_Area__c;
			$scope.location = opportunity.HOC__City_Text__c; //TODO - future: using for the occurrence locations - really should pull from opportunity location instead
			if(opportunity.HOC__Populations_Served__c === "other"){
				$scope.populationServed = "All";
			} else{
				$scope.populationServed = opportunity.HOC__Populations_Served__c;
			}
			
			//$scope.activityType //TODO: Can't find this data
			$scope.requirements = opportunity.HOC__Age_Groups_Served__c;			
		});
	
		var occurrencesQueryString = "SELECT * FROM HOC__Occurrence__c WHERE HOC__Volunteer_Opportunity__c = '" + opportunityId + "' AND HOC__Occurrence__c.HOC__Start_Date_Time__c >= date('" + $filter('date')(new Date(),'yyyy-MM-dd')  + "')";
		
		queryDB($http, occurrencesQueryString, function(response) {		
			var records = response.data.records, i;
			$scope.occurrences = [];
			for(i = 0; i < records.length; i++){
				$scope.occurrences.push(mapOccurrence(records[i], $scope.location, $filter));								
			}
			
			//make item "selected" if clicked
			$scope.selectedIndex = -1; // Whatever the default selected index is, use -1 for no selection
			$scope.itemClicked = function ($index) {
				$scope.selectedIndex = $index;
			};
			
		});
	};
	
    var init = function() {	  
		pullOpportunityDetail($routeParams.opportunityId);
	};
    
	init();
  });
  
  pcm.controller('SearchCtrl', function($scope, $http, $filter) {	 

	var populateCategories = function() {
		var queryString = "SELECT DISTINCT HOC__Primary_Impact_Area__c FROM HOC__Volunteer_Opportunity__c",
			i;
			
		queryDB($http, queryString, function(response) {		
		  
		  $scope.categories = [];
		  
		  for(i = 0; i < response.data.records.length; i++){
			$scope.categories.push(response.data.records[i].HOC__Primary_Impact_Area__c);
		  }		  
		});		
	}
	
	//TODO: Need to add search params to route so can go back from detail page
		
	$scope.updateSearch = function (){		
	
		//TODO: ALSO GET ONGOING OPPORTUNITIES - WHERE ARE THEY?
		//TODO: Filter by location (maybe not for this release)
		
		var queryString = "SELECT HOC__Occurrence__c.Id, HOC__Occurrence__c.HOC__Volunteer_Opportunity__c, HOC__Volunteer_Opportunity__c.HOC__City_Text__c, HOC__Volunteer_Opportunity__c.Name, HOC__Volunteer_Opportunity__c.HOC__Description__c, HOC__Occurrence__c.HOC__Start_Date_Time__c FROM HOC__Occurrence__c INNER JOIN HOC__Volunteer_Opportunity__c ON HOC__Occurrence__c.HOC__Volunteer_Opportunity__c = HOC__Volunteer_Opportunity__c.Id WHERE ";

		if($scope.category !== undefined){
			queryString = queryString + "HOC__Primary_Impact_area__c = '" + $scope.category + "' AND ";
		}

		queryString = queryString + "(HOC__Occurrence__c.HOC__Start_Date_Time__c >= date('" + $filter('date')($scope.startDate,'yyyy-MM-dd')  + "') AND HOC__Occurrence__c.HOC__Start_Date_Time__c <= date('" + $filter('date')($scope.endDate,'yyyy-MM-dd') + "')) ORDER BY HOC__Occurrence__c.HOC__Start_Date_Time__c";
				
		queryDB($http, queryString, function(response) {
			processSearchResults(response.data.records);		
		});
	}
	
	var processSearchResults = function (records){
		var i, record;
		
		//alert(records.length);
	
		$scope.days = {};
		
		for(i = 0; i < records.length; i++){
						
			record = records[i];
						
			var occurrence = {};
			
			occurrenceDateTime = new Date(record.HOC__Start_Date_Time__c.split(" ").join("T"));
					
			occurrence.timeString = $filter('date')(occurrenceDateTime, 'shortTime'); //TODO: Make time format hipster by parsing string after - drop minutes if 00 and make AM/PM lower case
			occurrence.location = record.HOC__City_Text__c;
			occurrence.title = record.Name;  //TODO: Really should grab this from somewhere in sales force - not sure where - and put record name as the organization name instead
			occurrence.organizationName = "";
			occurrence.opportunityId = record.HOC__Volunteer_Opportunity__c;
			
				
			
			occurrence.description =  trim(removeHtml(record.HOC__Description__c));
			
			//check if day exists - otherwise create a new one
			var dayString = $filter('date')(occurrenceDateTime,'longDate');
			if($scope.days[dayString] === undefined){
				$scope.days[dayString] = { dayString: dayString, occurrences: []};				
			}

			$scope.days[dayString].occurrences.push(occurrence);
		}
	}
	  
	var init = function() {	  
		populateCategories();

		$scope.distances = [		
			5,
			15,
			30
		];
		
		$scope.startDate = $filter('date')(new Date(),'yyyy-MM-dd');
		$scope.endDate = $filter('date')(new Date().setMonth(new Date().getMonth() + 2),'yyyy-MM-dd');
		
		$scope.updateSearch();
	};
    
	init();
});