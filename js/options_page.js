arr = {};
//wordArray = new Array();
var csvData;
var oWebsiteTable;
var oWordsTable;
document.addEventListener('DOMContentLoaded', function () {
    trackPageView();
    updateCheckboxOption(OPTION_ISACTIVE);
    updateCheckboxOption(OPTION_AUTOCAPITALIZE);
	updateCheckboxOption(OPTION_CORRECT_FAST_CAPITALIZE_ERROR);
    updateIgnoredWebsiteTable(false);
    $('#words-loader').css("display", "block");
    $('.myTable tfoot').css("display", "none");
    var promise = deferredFunction();
    promise.done(function () {
        updateWordListTable(false);    
    });

    $('#txtPauseKey').val(getStringOption(OPTION_PAUSE_KEY));
    $('#txtPauseKey').on("propertychange change keyup paste input", function(e){
        var value = $(this).val().toUpperCase();
        $(this).val(value);
        setStringOption(OPTION_PAUSE_KEY,value);
    });
    
    $('#txtAutoCapitalKeys').val(getStringOption(OPTION_AUTOCAPITALIZE_KEYS));
    $('#txtAutoCapitalKeys').on("propertychange change keyup paste input", function(e){
        var value = $(this).val();
        var arr = value.split('');
        var finalValue = '';
        for (data in arr) {
            if(isValidAutoCapitalChar(arr[data])){
                finalValue += arr[data];
            }
            else{
                alert('Invalid character : ' + arr[data]);
            }
                
        }
        value = finalValue;
        $(this).val(value);
        setStringOption(OPTION_AUTOCAPITALIZE_KEYS,value);
    });
  document.querySelector('#btnAddWebsite').addEventListener('click', addNewWebsite);
  document.querySelector('#btnAdd').addEventListener('click', addNewTypo);
  document.querySelector('#isActive').addEventListener('click', isActive);
  document.querySelector('#autoCapitalize').addEventListener('click', AutoCapitalize);
  document.querySelector('#handleFastCapitalize').addEventListener('click', handleFastCapitalize);
  document.querySelector('#cancelButton').addEventListener('click', cancel);
  document.querySelector('#resetButton').addEventListener('click', reset);
  document.getElementById('txtFileUpload').addEventListener('change', upload, false);
  $('#btnDeleteAll').click(function() {
		if(confirm("Are you sure you want to delete all ?")){
			setStringOption(OPTION_WORD_LIST,'');
			$('.myTable tbody').html('');
			arr = {};
			updateWordListTable(true);
			console.log('Delete All Completed');
			oWordsTable.rows().remove().draw();
			trackEvent('Options Page','Delete All Words');
		}
  });
  
  $('#btnCloseImport').click(function() {
	$('#dvImportSegments').addClass('hide');
	$('.import-message').addClass('hide').html('');
	$('.export-settings #btnImport').addClass('hide');
	resetFileInput();
  });
    
	function resetFileInput () {
	  var control = $('#txtFileUpload');
	  control.replaceWith( control.val('').clone( true ) );
	  document.getElementById('txtFileUpload').addEventListener('change', upload, false);
	}
  $("#exportButton").on("click", function(e) {
		$('#dvImportSegments').addClass('hide');
		$('.export-settings #btnImport').addClass('hide');
		var fullDate = new Date();
		var twoDigitMonth = fullDate.getMonth()+"";if(twoDigitMonth.length==1)  twoDigitMonth="0" +twoDigitMonth;
		var twoDigitDate = fullDate.getDate()+"";if(twoDigitDate.length==1) twoDigitDate="0" +twoDigitDate;
		var currentDate = fullDate.getFullYear() + "/" + twoDigitMonth + "/" + twoDigitDate;
        exportTableToCSV.apply(this, [$('.myTable tbody'), 'SpellBee_Export_'+currentDate+'.csv']);
		resetFileInput();
		trackEvent('Options Page','Export');
    });
	
	$("#importButton").on("click", function(e) {
		$('#dvImportSegments').removeClass('hide');
		$('.import-message').addClass('hide');
		$('.export-settings #btnImport').addClass('hide');
    });
	
	$('#btnImport').on("click", function() {
		data = $.csv.toArrays(csvData);
        if (data && data.length > 0) {
            $('.import-message').removeClass('hide').html(data.length + ' rows found! Importing into this sweet extension...');
			if($('#exportAppend').is(':checked')){
				setStringOption(OPTION_WORD_LIST,'');
				arr = {};
			}
			var newTypoCount = 0;
			for(var i = 0; i < data.length; i++ ){
					if(addTypo(data[i][0],data[i][1],true)){
						newTypoCount++;
					}
			}
			//updateWordListTable(true);
			window.location.reload();
			$('.import-message').html('Import Successful ! ' + newTypoCount + ' new Typos added!');
        } else {
            alert('No data to import!');
        }
		trackEvent('Options Page','Import');
  });
  
   $('#btnDeleteAllWebsites').click(function() {
		if(confirm("Are you sure you want to delete all blacklisted URLs?")){
			setStringOption(OPTION_URL_LIST,'');
			$('.myIgnoredSites tbody').html('');
			updateIgnoredWebsiteTable(true);
			console.log('Delete All Completed');
			oWebsiteTable.rows().remove().draw();
			trackEvent('Options Page','Delete All Websites');
		}
  });
  
  if(getBooleanOption(OPTION_BLOCK_URLS)){
        $(".sites #blacklist").prop("checked", true);
  }else{
        $(".sites #whitelist").prop("checked", true);
        $(".sites .myIgnoredSites thead tr td:first").html("Whitelisted Website(s)");
  }
   
   $('input[type=radio][name=listMode]').change(function() {
        if (this.value == 'true') {
            $(".sites #blacklist").prop("checked", true);
            setStringOption(OPTION_BLOCK_URLS,'true');
            $(".sites .myIgnoredSites thead tr td:first").html("Ignored Website(s)");
        }
        else{
            $(".sites #whitelist").prop("checked", true);
            setStringOption(OPTION_BLOCK_URLS,'false');
            $(".sites .myIgnoredSites thead tr td:first").html("Whitelisted Website(s)");
        }
    });
   
  $('body').on('click','.myIgnoredSites tbody a', function() {
		if(getStringOption(OPTION_URL_LIST)){
			var valueToRemove = $(this).data('url');
			removeURL(valueToRemove);
			$(this).parents('tr').remove();
			oWebsiteTable.row( $(this).parents('tr')).remove().draw();
			trackEvent('Options Page','Delete Website');
		}
  });
  
  $('body').on('click','.myTable tbody a.delete', function() {
		var valueToRemove = $(this).data('typo');
		var typo = valueToRemove.split("|")[0];
		var words = getStringOption(OPTION_WORD_LIST);
		var wordList = words.split("~");
		wordList = $.grep(wordList, function(value) {
				return value != valueToRemove;
			});
		var newLength = wordList.length;
			if(newLength > 1){
				words = wordList.join("~");
			}else if(newLength == 1){
				words = wordList[0];
			}else if(newLength == 0){
				words = '';
			}
		setStringOption(OPTION_WORD_LIST,words);
		delete arr[typo];
		$(this).closest('tr').remove();
		oWordsTable.row( $(this).parents('tr')).remove().draw();
		trackEvent('Options Page','Delete Word');
  });
  $('body').on('click','.myTable tbody a.edit', function() {
		var valueToRemove = $(this).data('typo');
		var words = getStringOption(OPTION_WORD_LIST);
		var wordList = words.split("~");
		var keyTd = $(this).parents('tr').find('td:first-child');
		var valueTd = $(this).parents('tr').find('td:nth-child(2)');
		var oldKey = keyTd.html();
		var oldValue = valueTd.html();
		keyTd.html('<input id="txtOldKey" data-oldKey="'+oldKey+'" type="textbox" value="'+oldKey+'"/>');
		valueTd.html('<input id="txtOldValue" data-oldValue="'+oldValue+'" type="textbox" value="'+oldValue+'"/>');
		$(this).parents('tr').find('.control-box').removeClass('hide');
		$(this).parents('tr').find('.basic-options').addClass('hide');
		trackEvent('Options Page','Edit Word');
  });
  $('body').on('click','.myTable tbody a.cancel', function() {
		var oldKey = $(this).parents('tr').find('td:first-child input').attr('data-oldKey');
		var oldValue = $(this).parents('tr').find('td:nth-child(2) input').attr('data-oldValue');
		$(this).parents('tr').find('td:first-child').html(oldKey);
		$(this).parents('tr').find('td:nth-child(2)').html(oldValue);
		$(this).parents('tr').find('.control-box').addClass('hide');
		$(this).parents('tr').find('.basic-options').removeClass('hide');
  });
  $('body').on('click','.myTable tbody a.update', function() {
		var valueToRemove = $(this).parents('tr').find('a.edit').data('typo');
		
		var words = getStringOption(OPTION_WORD_LIST);
		var wordList = words.split("~");
		wordList = $.grep(wordList, function(value) {
				return value != valueToRemove;
			});
		var newLength = wordList.length;
			if(newLength > 1){
				words = wordList.join("~");
			}else if(newLength == 1){
				words = wordList[0];
			}else if(newLength == 0){
				words = '';
			}
		
		setStringOption(OPTION_WORD_LIST,words);
		
		var keyTd = $(this).parents('tr').find('td:first-child input');
		var valueTd = $(this).parents('tr').find('td:nth-child(2) input');
		var newKey = keyTd.val();
		var newValue = valueTd.val();
		if(addTypo(newKey,newValue,false)){
			$(this).parents('tr').find('td:first-child').html(newKey);
			$(this).parents('tr').find('td:nth-child(2)').html(newValue);
			$(this).parents('tr').find('.control-box').addClass('hide');
			$(this).parents('tr').find('.basic-options').removeClass('hide');
			trackEvent('Options Page','Update Word');
		}
  });
  
});

function isValidAutoCapitalChar(str){
    if(str.length > 1){
        return false;
    }
 return /[.~`!#$%\^&*+=\-\[\]\\';,/{}()|\\":<>\?_]/g.test(str);
}

function isActive() {
  setBooleanOption(OPTION_ISACTIVE, document.getElementById(OPTION_ISACTIVE).checked);
}

function AutoCapitalize() {
  setBooleanOption(OPTION_AUTOCAPITALIZE, document.getElementById(OPTION_AUTOCAPITALIZE).checked);
}

function handleFastCapitalize() {
  setBooleanOption(OPTION_CORRECT_FAST_CAPITALIZE_ERROR, document.getElementById(OPTION_CORRECT_FAST_CAPITALIZE_ERROR).checked);
}

function cancel() {
  window.close();
}
function reset() {
if(confirm("Are you sure you want to reset?")){
  trackEvent('Options Page','Reset');
  setBooleanOption(OPTION_ISACTIVE, defaults[OPTION_ISACTIVE]);
  setStringOption(OPTION_URL_LIST,defaults[OPTION_URL_LIST]);
  setStringOption(OPTION_WORD_LIST,defaults[OPTION_WORD_LIST]);
  setStringOption(OPTION_PAUSE_KEY,defaults[OPTION_PAUSE_KEY]);
  setStringOption(OPTION_AUTOCAPITALIZE,defaults[OPTION_AUTOCAPITALIZE]);
  setStringOption(OPTION_CORRECT_FAST_CAPITALIZE_ERROR,defaults[OPTION_CORRECT_FAST_CAPITALIZE_ERROR]);
  setStringOption(OPTION_AUTOCAPITALIZE_KEYS,defaults[OPTION_AUTOCAPITALIZE_KEYS]);
  setStringOption(OPTION_BLOCK_URLS,defaults[OPTION_BLOCK_URLS]);
  $('.myTable tbody').html('');
  $('.myIgnoredSites tbody').html('');
  console.log('Reset Complete');
  window.location.reload(true);
  }
}

function updateIgnoredWebsiteTable(isReset){
	if(getStringOption(OPTION_URL_LIST)){
	var ignoredWebsites = getStringOption(OPTION_URL_LIST);
	var ignoredWebsitesList = ignoredWebsites.split(";");
		var l = ignoredWebsitesList.length;
		$('.myIgnoredSites tbody').html('');
		for (i=0; i<l; i++) {
			$('.myIgnoredSites tbody').append('<tr><td>'+ ignoredWebsitesList[i]+'</td><td class=\'delete\'><a data-url=\''+ignoredWebsitesList[i]+'\'>Delete</a></td></tr>');
		}
	}
	initializeURLTable(isReset);
	
}

function updateWordListTable(isReset){
	var words = getStringOption(OPTION_WORD_LIST);
	if(words){
        var userDefinedList = words.split("~");
        var l = userDefinedList.length;
        $('.myTable tbody').html('');
        for (i=0; i<l; i++) {
                var split = userDefinedList[i].split("|");
                var key = split[0];
                var value = split[1];
                arr[key] = {value: split[1]};
                $('.myTable tbody').append(WordListTableRowGenerator(key,value));
                /*wordArray.push([key,value,'<a class="hide control-box update"><img src="images/save.png" alt="Save" title="Save"/></a><a class="hide control-box cancel"><img src="images/stop.png" alt="Cancel" title="Cancel"/></a><a class=\'edit basic-options\' data-typo=\''+key+'|'+value+'\'><img src="images/pencil.png" alt="Edit" title="Edit"/></a><a class=\'delete basic-options\' data-typo=\''+key+'|'+value+'\'><img src="images/delete.png" alt="Delete" title="Delete"/></a>']);*/
        }
	}
	initializeTypoTable(isReset);
}

function WordListTableRowGenerator(key,value){
	return '<tr><td class="data">'+ key+'</td><td class="data">'+ value +'</td><td><a class="hide control-box update"><img src="images/save.png" alt="Save" title="Save"/></a><a class="hide control-box cancel"><img src="images/stop.png" alt="Cancel" title="Cancel"/></a><a class=\'edit basic-options\' data-typo=\''+key+'|'+value+'\'><img src="images/pencil.png" alt="Edit" title="Edit"/></a><a class=\'delete basic-options\' data-typo=\''+key+'|'+value+'\'><img src="images/delete.png" alt="Delete" title="Delete"/></a></td></tr>'
}

String.prototype.startsWith = function (str){
    return this.slice(0, str.length) == str;
  };
 
function addNewWebsite() {
	var url = $('#txtIgnoreWebsite').val().trim().toLowerCase();
	if(!url){alert('Enter a website URL'); return false;}
	if(!url.startsWith('http://') && !url.startsWith('https://')){
		url = 'http://' + url;
	}
	if(!/^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/|www\.)[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/.test(url)){
		alert("Enter a valid website URL"); return false;
	}
	
	var value = getStringOption(OPTION_URL_LIST);
	
	url = url_domain(url).replace('http://','').replace('https://','');
	if(value.contains(url+ ";") || value.contains(url)){
		alert("URL is already blacklisted"); return false;
	}
	value = !value ? url : value + ";" + url;
	setStringOption(OPTION_URL_LIST,value);
	if($('.myIgnoredSites tbody td.dataTables_empty').length > 0){
		$('.myIgnoredSites tbody').html('');
	}
	$('.myIgnoredSites tbody').append('<tr><td>'+ url+'</td><td class=\'delete\'><a data-url=\''+url+'\'>Delete</a></td></tr>');
	$('#txtIgnoreWebsite').val('');
	oWebsiteTable.row.add([url,'<a data-url=\''+url+'\'>Delete</a>']).draw();
	trackEvent('Options Page','Add New Website',url);
		
}

function url_domain(data) {
  var    a      = document.createElement('a');
         a.href = data;
  return a.hostname;
}

function initializeURLTable(isReset){
	$(document).ready(function() {
		if (typeof oWebsiteTable == 'undefined') {
			oWebsiteTable = $('.myIgnoredSites').DataTable({
			"paging":   false,
			"ordering": true,
			"info":     true,
			"sScrollY": "100",
			"bScrollCollapse": true,
			"bDestroy": true,
			"bJQueryUI": true,
			"aoColumnDefs": [
			  { 'bSortable': false, 'aTargets': [ 1 ] },{ "sWidth": "100px", "aTargets": [ 1 ] }]
			});
            
            
		}
	});
	
	
	
}

function initializeTypoTable(isReset){
	$(document).ready(function() {
			if (typeof oWordsTable == 'undefined') {
				oWordsTable = $('.myTable').DataTable({
					"paging":   false,
					"ordering": true,
					"info":     true,
					"sScrollY": "200",
					"bJQueryUI": true,
					"bScrollCollapse": true,
					"bDestroy": true,
                    "bProcessing": true,
                    "bDeferRender": true,
                    "deferRender": true,
					"aoColumnDefs": [
					  { 'bSortable': false, 'aTargets': [ 2 ] },{ "sWidth": "10%", "aTargets": [ 2 ] }
				   ],
                   "initComplete": function(settings, json) {
                        $('#words-loader').css("display", "none");
                        $('.myTable tfoot').css("display", "block");
                    }
			});
            
            oWordsTable.on( 'draw', function () {
                
            } );
		}
		
		
		/*$('#example').dataTable( {
			"data": wordArray,
			"paging":   false,
			"ordering": true,
			"info":     true,
			"sScrollY": "200",
			"bJQueryUI": true,
			"bScrollCollapse": true,
			"bDestroy": true,
			"columns": [
				{ "title": "Typo" },
				{ "title": "Correction" },
				{ "title": "Actions"}
			],
			"aoColumns": [
				{ "sWidth": "95px", "sClass": "data" },
				{ "sWidth": "45px", "sClass": "data" },
				{ "sWidth": "45px", "sClass": "" }
			]
		});   */
		
	});
}

function addNewTypo() {
	var key = $('#txtReplace').val().trim();
	var value = $('#txtWith').val().trim();
	if(addTypo(key,value,false)){
		//if($('.myTable tbody td.dataTables_empty').length > 0){
		//	$('.myTable tbody').html('');
		//}
		//$('.myTable tbody').append(WordListTableRowGenerator(key,value));
		$('#txtReplace').val('');
		$('#txtWith').val('');
		oWordsTable.row.add([key,value,'<a class="hide control-box update"><img src="images/save.png" alt="Save" title="Save"/></a><a class="hide control-box cancel"><img src="images/stop.png" alt="Cancel" title="Cancel"/></a><a class=\'edit basic-options\' data-typo=\''+key+'|'+value+'\'><img src="images/pencil.png" alt="Edit" title="Edit"/></a><a class=\'delete basic-options\' data-typo=\''+key+'|'+value+'\'><img src="images/delete.png" alt="Delete" title="Delete"/></a>']).draw();
		trackEvent('Options Page','Add New Typo', key + ' | ' + value);
	}
	
}

function addTypo(typo,replaceWith,override) {
    replaceWith = replaceWith.replace('’',"'");
    typo = typo.replace('’',"'");
    if(replaceWith == "*")
        return false;
	if(!typo || !replaceWith){
		addTypoErrors(1,override); return false;}
	if(typo.contains(' ')){
		addTypoErrors(2,override);
		return false;
	}
	if(typo.contains('~') || replaceWith.contains('~') || typo.contains('|') || replaceWith.contains('|') || typo.contains(',') || replaceWith.contains(',')) {
		addTypoErrors(3,override);
		return false;
	}	
	if(typo.toLowerCase() in arr){
		addTypoErrors(4,override);return false;	}
	
	var words = getStringOption(OPTION_WORD_LIST);
	if(!words){
		words = typo.toLowerCase()+'|'+replaceWith;
	}
	else{
		words = words + "~" + typo.toLowerCase()+'|'+replaceWith;
	}
	setStringOption(OPTION_WORD_LIST,words);
	arr[typo] = {value: replaceWith};
	return true;
}

function addTypoErrors(errorType,override){
	if(!override){
		switch(errorType){
			case 1:
				alert('Aren\'t you forgetting something ?');
				break;
			case 2:
				alert('Typo can\'t contain Space.. Sorry');
				break;
			case 3:
				alert('Can\'t contain special characters. Sorry');
				break;
			case 4:
				alert('Typo already exists');
				break;
		}
	
	}

}

    function exportTableToCSV($table, filename) {

        var $rows = $table.find('tr:has(td)'),

            // Temporary delimiter characters unlikely to be typed by keyboard
            // This is to avoid accidentally splitting the actual contents
            tmpColDelim = String.fromCharCode(11), // vertical tab character
            tmpRowDelim = String.fromCharCode(0), // null character

            // actual delimiter characters for CSV format
            colDelim = '","',
            rowDelim = '"\r\n"',

            // Grab text from table into CSV formatted string
            csv = '"' + $rows.map(function (i, row) {
                var $row = $(row),
                    $cols = $row.find('td.data');

                return $cols.map(function (j, col) {
                    var $col = $(col),
                        text = $col.text();

                    return text.replace('"', '""'); // escape double quotes

                }).get().join(tmpColDelim);

            }).get().join(tmpRowDelim)
                .split(tmpRowDelim).join(rowDelim)
                .split(tmpColDelim).join(colDelim) + '"',

            // Data URI
            csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csv);

        $(this)
            .attr({
            'download': filename,
                'href': csvData,
                'target': '_blank'
        });
    }
	
	// Method that checks that the browser supports the HTML5 File API
    function browserSupportFileUpload() {
        var isCompatible = false;
        if (window.File && window.FileReader && window.FileList && window.Blob) {
			isCompatible = true;
        }
        return isCompatible;
    }

    // Method that reads and processes the selected file
    function upload(evt) {
    if (!browserSupportFileUpload()) {
        alert('The File APIs are not fully supported in this browser! Try Updating Chrome :(');
        } else {
            var data = null;
            var file = evt.target.files[0];
            var reader = new FileReader();
            reader.readAsText(file);
            reader.onload = function(event) {
                csvData = event.target.result;
                $('.export-settings #btnImport').removeClass('hide');
            };
            reader.onerror = function() {
                alert('Unable to read ' + file.fileName);
            };
		}
	}
    
    function deferredFunction() {
        var deferredObject = $.Deferred();
        setTimeout(function() { deferredObject.resolve();  }, 500);
        return deferredObject.promise();
    };