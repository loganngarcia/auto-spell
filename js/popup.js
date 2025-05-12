// Initialization
var TabUrl = '';
var TabId = 0;
var isDisabled = false;
var isExtensionActive = true;
var BlockURLs = true;
var chromeUrl = 'https://chrome.google.com/webstore/detail/spell-bee/dfbnahffpakjbdlccohcoglcnafhgnhm';
var URL_SCRIPTS_DISALLOWED =
    'https://chrome.google.com/extensions/|https://chrome.google.com/webstore';
var ShareTitle = 'Yo ! Check Out this Cool Auto-Correct Chrome Extension !'
var isDebug = false;
var options = function() {
	trackPageView('PopUp','Go to Options');
	chrome.tabs.create({'url': chrome.extension.getURL("options.html") } )
};

function url_domain(data) {
  var a = document.createElement('a');
  a.href = data;
  return a.hostname;
}

var openShareDialog = function(url){
			var w = 580;
			var h = 480;
			var left = (screen.width/2)-(w/2);
			var top = (screen.height/2)-(h/2); 	
			chrome.windows.create({url: url, type: 'popup', width: w, height: h, left: left, top: top });
};

var init = function() {
	chrome.tabs.query({active: true, 'windowId': chrome.windows.WINDOW_ID_CURRENT}, function(tab) {	
			TabUrl = tab[0].url;
			TabUrl = url_domain(TabUrl);
			TabId = tab[0].id;
			chrome.runtime.sendMessage({method: "getMyStorageValues"}, function(response) {
				isExtensionActive = response.IsActive;
				BlacklistedURLs = response.UrlList.trim();
                BlockURLs = response.BlockUrls;
				if(BlacklistedURLs) {
                    print('IsActive : ' + isExtensionActive + ' | BlockURLs : ' + BlockURLs);
					var ignoredWebsitesList = BlacklistedURLs.split(";");
                    if(BlockURLs === 'true'){
                        if($.inArray(TabUrl, ignoredWebsitesList) > -1)
                        {
                            isDisabled = true;
                        }
                    }
                    else{
                        if($.inArray(TabUrl, ignoredWebsitesList) ==  -1)
                        {
                            isDisabled = true;
                        }
                    }
				}
                else{
                    if(BlockURLs === 'false'){
                         isDisabled = true;
                    }
                }
                print('isDisabled : ' + isDisabled);
				if(isExtensionActive == "true") {
					$('.app-disabled').addClass('hide');
					$('.site-status').removeClass('hide');
				}
				else{	
					isDisabled = true;
					$('.app-disabled').removeClass('hide');
					$('.site-status').addClass('hide');
				}
				isDisabled ? isAppDisabled(true) : isAppDisabled(false);
		});		
	});

};

function isAppDisabled(disabled) {
			if(disabled) {
				$('.off').removeClass('hide');
				$('.on').addClass('hide');
				chrome.runtime.sendMessage({ method: "changeIcon", "newIconPath" : "/images/icon-38x38-disabled.png", "tabId" : TabId });
			}
			else{
				$('.on').removeClass('hide');
				$('.off').addClass('hide');
				chrome.runtime.sendMessage({ method: "changeIcon", "newIconPath" : "/images/icon-38x38.png", "tabId" : TabId });
			}	
}

function appStatus(){
	chrome.runtime.sendMessage({method: "updateAppStatus"}, function(response) {
		if(response && response.Status == "true"){
				$('.app-disabled').addClass('hide');
				$('.site-status').removeClass('hide');
				$('.notification').removeClass('hide');
				isAppDisabled(false);
				trackPageView('PopUp','App Active/Inactive');
		}
	});
}

function print(msg)
{
	if(isDebug){
		console.log(msg);
	}
}

document.addEventListener('DOMContentLoaded', function () {
  init();
  document.querySelector('#options').addEventListener('click', options);
  document.querySelector('.app-disabled .disabled').addEventListener('click', appStatus);
  $('.site-status .disabled , .site-status .enabled').on('click',function(){
		$('.loader').removeClass('hide');
		chrome.runtime.sendMessage({method: "updateSiteStatus", currentStatus: isDisabled, BlockingStatus : BlockURLs, url: TabUrl}, function(response) {
			if(response && response.Status == "true"){
				var newAppStatus = response.newStatus;
				(newAppStatus) ? isAppDisabled(true) : isAppDisabled(false);	
				isDisabled = !isDisabled;
				trackPageView('PopUp','Block Website', isDisabled);
				$('.notification').removeClass('hide');
			}
		});
		$('.loader').addClass('hide');
  });
  document.querySelector('#options').addEventListener('click', options);
  $('.share-box .share-facebook').on('click',function(){
		openShareDialog('http://www.facebook.com/sharer.php?u='+escape(chromeUrl) + '&p[summary]='+escape(ShareTitle));
		trackEvent('Share','Facebook');
  });
  $('.share-box .share-twitter').on('click',function(){
		openShareDialog('http://twitter.com/share?url='+escape('http://goo.gl/zuxkKx') + '&text=' + escape(ShareTitle));
		trackEvent('Share','Twitter');
  });
  $('.share-box .share-google').on('click',function(){
		openShareDialog('https://plusone.google.com/_/+1/confirm?hl=en&url='+escape(chromeUrl) + '&title='+escape(ShareTitle));
		trackEvent('Share','Google');
  });
  trackPageView();
  trackPageView('PopUp','Open');
});