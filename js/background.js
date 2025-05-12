chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

	switch(request.method)
	{
		case "getMyStorageValues":
			var response = {
							'WordList' : getStringOption(OPTION_WORD_LIST),
							'IsActive' : getStringOption(OPTION_ISACTIVE),
							'UrlList'  : getStringOption(OPTION_URL_LIST),
                            'BlockUrls'  : getStringOption(OPTION_BLOCK_URLS),
                            'AutoCapitalize' : getStringOption(OPTION_AUTOCAPITALIZE),
                            'AutoCapitalizeKeys' : getStringOption(OPTION_AUTOCAPITALIZE_KEYS),
							'HandleFastCapitalize' : getStringOption(OPTION_CORRECT_FAST_CAPITALIZE_ERROR),
                            'PauseKey' : getStringOption(OPTION_PAUSE_KEY)
							};
			sendResponse(response);
			break;
		case "changeIcon":
			// read `newIconPath` from request and read `tab.id` from sender
			var tabId = request.tabId;
			if(!tabId){
				tabId = sender.tab.id;
			}
			chrome.browserAction.setIcon({
				path: request.newIconPath,
				tabId: tabId
			});
			sendResponse({});
			break;
		case "updateAppStatus":
			
			setBooleanOption(OPTION_ISACTIVE, "true");
			var response = {
							'Status' : getStringOption(OPTION_ISACTIVE)
							};
			sendResponse(response);
			break;
		case "updateSiteStatus":
			var isCurrentlyDisabled = request.currentStatus;
			var websiteURL = request.url;
            var BlockingStatus = request.BlockingStatus;
			var isDisabled = false;
            if(BlockingStatus === 'true'){
                if(isCurrentlyDisabled){
                    //remove from blacklist
                    removeURL(websiteURL);
                }
                else{
                    // add in blacklist
                    addURL(websiteURL);
                    isDisabled = true;
                }
            }
            else{
                if(isCurrentlyDisabled){
                    //add to whitelist
                    addURL(websiteURL);
                }
                else{
                    // remove from whitelist
                    removeURL(websiteURL);
                    isDisabled = true;
                }
            }
			var response = {
							'Status' : 'true',
							'newStatus' : isDisabled
							};
			sendResponse(response);
			break;
		default:
			sendResponse({});
			break;
	}
});
