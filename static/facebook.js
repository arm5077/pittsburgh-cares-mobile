function facebookLogin() {

	FB.login(function(response) {
		if (response.authResponse) {
			fillOutForm();
		} else {
			console.log('User cancelled login or did not fully authorize.');
		}
	},{scope: 'email,user_birthday'});
 
}

function fillOutForm() {
	
	FB.api('/me', function(response) {
        
		if(response.first_name) $("#first-name").val(response.first_name);
		if(response.last_name) $("#last-name").val(response.last_name);
		if(response.birthdate) $("#birthdate").val(response.birthdate);
		if(response.email) $("#email").val(response.email);
		
		
    });
	
	
}

$(document).ready(function(){
	$.ajaxSetup({ cache: true });
	$.getScript('http://connect.facebook.net/en_UK/all.js', function(){
		FB.init({
		appId: '1437812346455949',
		});     
		$('#loginbutton,#feedbutton').removeAttr('disabled');
		FB.getLoginStatus(fillOutForm);
	});
	
	
	 
});

