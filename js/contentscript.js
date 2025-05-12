var arr = {};
var WordList;
var IsActive = true;
var BlacklistedURLs = '';
var BlockURLs = true;
var isAppActive = true;
var ie = (typeof document.selection != "undefined" && document.selection.type != "Control") && true;
var w3 = (typeof window.getSelection != "undefined") && true;
var pageInitialized = false, autoCapitalize = true, handleFastCapitalize = true, handleFastCapitalizeError = false;
var autoCapitalizeKeys = '.';
var isDebug = false;
var prevKey = -1, currentKey;
var enterKeyCode = 13, spaceKeyCode = 32, commaKeyCode = 44, exclamationKeyCode = 33, questionMarkKeyCode = 63, fullstopKeyCode = 46, PauseKey = 83;

String.prototype.isUpper = function() {
    return this.valueOf().toUpperCase() === this.valueOf();
};

String.prototype.isRemainderLower = function(pos) {
    return this.valueOf().substring(pos).toLowerCase() === this.valueOf().substring(pos);
};

String.prototype.isTitleCase = function(pos) {
    var chr = this.charAt(pos);
	var alphaExp = /[^a-zA-Z]+/;
    return (chr === chr.toUpperCase() && isNaN(chr) && (chr.search(alphaExp) === -1));
};

String.prototype.myTrim = function() {
	return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
};

String.prototype.EndsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};
String.prototype.StartsWith = function(prefix) {
    return this.indexOf(prefix) == 0;
};

$(document).ready(function() {
	if(pageInitialized) return;
    pageInitialized = true;
	var url = location.hostname.toLowerCase();
	try
	{
		chrome.runtime.sendMessage({method: "getMyStorageValues"}, function(response) {
			IsActive = response.IsActive;
			WordList = response.WordList;
			BlacklistedURLs = response.UrlList;
            BlockURLs = response.BlockUrls;
            autoCapitalize = response.AutoCapitalize === "true" ? true : false;
            autoCapitalizeKeys = response.AutoCapitalizeKeys;
			handleFastCapitalize = response.HandleFastCapitalize === "true" ? true : false;
            PauseKey = response.PauseKey.charCodeAt(0);
			if(IsActive === "true") {	
				var ignoredWebsitesList = BlacklistedURLs.split(";");
                
                if(BlockURLs === "true") {
                    if($.inArray(url, ignoredWebsitesList) < 0)
                    {
                        Init();
                        isAppActive = true;
                    }
                    else{
                        isAppActive = false;
                    }
                }else{
                    
                    if($.inArray(url, ignoredWebsitesList) >= 0)
                    {
                        Init();
                        isAppActive = true;
                    }
                    else{
                        isAppActive = false;
                    }
                
                }
			}
			else{
				isAppActive = false;
				
			}
			//print('isAppActive : ' + isAppActive);
			ChangeIcon();
			
		});
	}
	catch(err)
	{ print(err);}
	
	function ChangeIcon(){
        if (window === window.top) {
			isAppActive ? chrome.runtime.sendMessage({ method: "changeIcon", "newIconPath" : "images/icon-38x38.png" }) :
				chrome.runtime.sendMessage({ method: "changeIcon", "newIconPath" : "images/icon-38x38-disabled.png"});
		}
    }    


	function Init() {
		var userDefinedList = WordList.split("~");
		var l = userDefinedList.length;
		for (i=0; i<l; i++) {
			userDefinedList[i] = userDefinedList[i].split("|");
			var key = userDefinedList[i][0];
			arr[key] = {value: userDefinedList[i][1]};
		}
        
        $(document).keydown(function(e) {
            if(e.which == PauseKey && e.altKey) {
                // Disable plugin
                isAppActive = isAppActive ? false : true;
                ChangeIcon();
                NotifyUser();
            }
        });
		bindControls();
		// Call it after every 10 sec to bind dynamically created textbox - such as FB chat
		setInterval(bindControls,10000);
	}
    
    function NotifyUser(){
        var logoURL =  isAppActive ? chrome.extension.getURL("images/icon-38x38.png") : chrome.extension.getURL("images/icon-38x38-disabled.png");
        var notificationText = isAppActive ? 'Activated' : 'Paused';
        var notificationHTML = '<div id="spell-bee-notification" style="top: 0px; right: 0px;margin: 5px;position: fixed;z-index: 1050;width: 155px;"><div><div style="display: block;height: inherit;margin: 3px;position: relative;width: inherit;"><div style="background-color: #f2f2f2;color: #000; background-position: 3px 7px;background-repeat: no-repeat;border: 3px solid #000;border-radius: 4px;font-weight: bold;padding: 8px 15px 8px 25px;text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);white-space: nowrap;"><img src="'+logoURL+'" /><p style="padding-left:10px;float: right;font-size: 12px;height: 40px;width: 60px;margin: 0;padding: 13px 0;">'+notificationText+'</p></div></div></div></div>';
        $('body').append(notificationHTML);
        window.setTimeout( function(){
            $('#spell-bee-notification').remove();
        }, 5000 );
    }
	
	function bindControls() {
		// check if textbox has been already been bound with keypress event
		$("input[type='text'], textarea,div[contentEditable='true'],span[contentEditable='true'],p[contentEditable='true'],[spellcheck='true']").each(function(index) {
			if($(this).data('AutoCorrectEnabled') != true && $(this).data('isAutoCorrectEnabled') == undefined){
				$(this).bind("keypress", function(e) {  
                    if(!isAppActive){
                        return;
                    }
					var sentence = $(this).val().myTrim();
					var isContentEditable = false;
					if($(this).get(0).tagName == 'DIV' || $(this).get(0).tagName == 'SPAN'){
						sentence = $(this).html().replace( /<br>/g, '\n' ).myTrim();
						isContentEditable = true;
					}

                    currentKey = e.which;
					if ((currentKey == spaceKeyCode || currentKey == fullstopKeyCode || currentKey == exclamationKeyCode || currentKey == commaKeyCode || currentKey == questionMarkKeyCode || currentKey == enterKeyCode) && ((currentKey != prevKey && !(prevKey >= 48 && prevKey <= 57)) || prevKey == -1)){
						lookup(this,sentence,isContentEditable);
					}
                    prevKey =  currentKey;                    
				});
				$(this).data('isAutoCorrectEnabled',true);
			}
		});
	}

	function setCaretPosition (tControl, iPosition)
    {
        // *) Input & Textarea
        if(tControl.selectionStart || tControl.selectionStart == '0')
        {
            tControl.selectionStart = iPosition;
            tControl.selectionEnd = iPosition;
            return;
        }
        // *) IFrame
        if(tControl.contentWindow && tControl.contentWindow.getSelection)
        {
            var tRange = tControl.contentDocument.createRange();
            tRange.setStart(tControl.contentDocument.body.firstChild, iPosition);
            tRange.setEnd(tControl.contentDocument.body.firstChild, iPosition);

            var tSelection = tControl.contentWindow.getSelection();
            tSelection.removeAllRanges();
            tSelection.addRange(tRange);

            return;
        }
        // *) Div
        if(window.getSelection)
        {
			if (tControl.selectionStart || tControl.selectionStart == "0")
			{
				tControl.selectionStart = iPosition;
				tControl.selectionEnd = iPosition;
			}
		  return;
        }
		
		
    }   
	
	// find position of last occurrence of string within variable
	function strrpos (haystack, needle, offset) {
		var i = (haystack+'').lastIndexOf(needle, offset); // returns -1
		return i >= 0 ? i : -1;
	}

	function toTitleCase(str, forcedCamel = false)
	{
        var i = 0;
        var titleCasedString = '';
        while(str.charCodeAt(i) === 32 || str.charCodeAt(i) === 160){
            titleCasedString +=' ';
            i++;
        }
		if(forcedCamel){
			return titleCasedString + str.charAt(i).toUpperCase() + str.substr(i+1).toLowerCase();
		}
		else{
			return titleCasedString + str.charAt(i).toUpperCase() + str.substr(i+1);
		}
	}

function findNode(list, node) {
	  for (var i = 0; i < list.length; i++) {
		if (list[i] == node) {
		  return i;
		}
	  }
	  return -1;
	}	
	
	
	function lookup(input,val,isContentEditable) {
		val = val.replace(/&nbsp;/g, ' ').replace(/\u200B/g, '').replace(/\r\n/g, "\n");
		var currentCaret = $(input).caret('pos');
		var selObj;
		var IsDIV = false;
		if (document.activeElement.tagName == 'IFRAME'){
			var cDoc = document.activeElement.contentDocument;							
			selObj = cDoc.getSelection();
			var selRange = selObj.getRangeAt(0);
			selCont = selRange.startContainer;
			currentCaret =  findNode(selObj.anchorNode.parentNode.childNodes, selObj.anchorNode) + selObj.anchorOffset;	
			currentCaret = currentCaret - 1;

		}
		else if (isContentEditable) {
				selObj = window.getSelection();
				var selRange = selObj.getRangeAt(0);
				selCont = selRange.startContainer;
				
				currentCaret =  findNode(selObj.anchorNode.parentNode.childNodes, selObj.anchorNode) + selObj.anchorOffset;
				
				if (1 > currentCaret) {
					return;
				}
				
				val = selCont.data;
                if(val == undefined){
                    return;
                }
				if (val.indexOf('\u200B') > -1){
					if (val.indexOf('\u200B') == currentCaret){
						val.replace('\u200B', '');
                            currentCaret--;
					}
				}
                
                
		}
		var stringUptoCaret = val.substring(0,currentCaret);
		var stringAfterCaret = val.substring(currentCaret);
		var inputText = val.substring(0,currentCaret);
        var fakeFirst = false, handleFastCapitalizeError = false;
		var pos = strrpos(inputText, ' ');
        var lineBreakPos = strrpos(inputText, '\n');
        var HTMLTagPos = strrpos(inputText, '>');
        var isLineBreak = false;
        if(pos < lineBreakPos && lineBreakPos > HTMLTagPos){
            pos = lineBreakPos;
            fakeFirst = true;
            isLineBreak = true;
        }
        print('pos:' + pos);
		var lastWord = inputText.substring(pos + 1);//.myTrim();
        var firstSpecialCharList = [ '(', ')','-','\'','"' ];
        var firstChar = lastWord.charAt(0);
        var isFirstCharSpecialChar = $.inArray( firstChar, firstSpecialCharList ) > -1 ? true : false;
        lastWord = isFirstCharSpecialChar ? lastWord.substring(1) : lastWord;
        var autoCorrect = (lastWord.myTrim().toLowerCase() in arr) ? true : false;
        var needToCap = (lastWord.myTrim().isUpper()) ? true : false;
        var lastCharBeforeCaret = stringUptoCaret.substring(0,pos).myTrim().slice(-1);
        var titleCaseChars = autoCapitalizeKeys.split('');;
        var TitleCaseLastWord = $.inArray( lastCharBeforeCaret, titleCaseChars ) > -1 ? true : false;
        print('lastCharBeforeCaret :'+lastCharBeforeCaret);
        
        var isFirstWord = fakeFirst ? false : ((pos < 0 && !fakeFirst) ? true : false);
        var isTitleCase = ((lastWord.myTrim().isTitleCase(0) && lastWord.isRemainderLower(1) ) || TitleCaseLastWord || isFirstWord) && autoCapitalize && !needToCap ? true : false;
        
		// to check if user Title cases first two alphabets while typing FAst
		if(handleFastCapitalize && lastWord.myTrim().isTitleCase(0) && lastWord.myTrim().isTitleCase(1) && lastWord.isRemainderLower(2) && autoCapitalize){
			isTitleCase = true;
			handleFastCapitalizeError = true;
		}
	

        if(autoCorrect || needToCap || isTitleCase){
            
            print('needToCap : ' + needToCap + ' | TitleCaseLastWord : ' + TitleCaseLastWord + ' | isTitleCase :' + isTitleCase);
            print('Last word 1-->|' +lastWord+'|');
            var needSpaceAdjustment = lastWord != lastWord.myTrim() ? true : false;
            var replacedWord = autoCorrect ? arr[lastWord.myTrim().toLowerCase()].value : lastWord;
            var toReplace = needToCap ? replacedWord.toUpperCase() : replacedWord;
            toReplace = isTitleCase ? toTitleCase(toReplace, handleFastCapitalizeError) : toReplace;
            toReplace = needSpaceAdjustment ? ' ' + toReplace: toReplace.myTrim();
            
            if((TitleCaseLastWord || isFirstWord || isTitleCase) && !autoCorrect && autoCapitalize && !needToCap){
                autoCorrect = true;
                toReplace = toTitleCase(lastWord, handleFastCapitalizeError);
            }
            toReplace = isFirstCharSpecialChar ? firstChar + toReplace : toReplace;
            print('Replaced word -->' +toReplace);
            // Adjusting Caret position after word is replaced
            var lastWordLength = isFirstCharSpecialChar ? lastWord.length + 1 : lastWord.length;
            var adjustion = currentCaret - lastWordLength + toReplace.length;
            currentCaret = (autoCorrect) ? adjustion : currentCaret;
            //print('current Caret -->' +currentCaret);
            //print('stringUptoCaret -->' +stringUptoCaret);
            //print('stringAfterCaret -->' +stringAfterCaret);
            

            var keyCodes = [enterKeyCode,commaKeyCode,exclamationKeyCode,questionMarkKeyCode,fullstopKeyCode];
            var isSpecialKeyCode = false;
            if($.inArray(currentKey, keyCodes) > -1){
                isSpecialKeyCode = true;
                //currentCaret++;
            }
            var finalVal = autoCorrect ? 
                                (isFirstWord ? 
                                        toReplace + stringAfterCaret : 
                                        stringUptoCaret.substring(0,pos) + ((isLineBreak) ? '\r\n' : ' ') + toReplace +stringAfterCaret) :
                                val;
            print('Final Value -->' +finalVal);
            if(isContentEditable){
                var fakeCaret = finalVal.length;
                if(currentCaret > fakeCaret){
                    currentCaret = fakeCaret;
                }
                selCont.data = finalVal;
                selObj.collapse(selCont, currentCaret);
            }else{
                $(input).val(finalVal);
            }
            setCaretPosition(input,currentCaret);
        }
	}

});

function print(msg)
{
	if(isDebug){
		console.log(msg);
	}
}
