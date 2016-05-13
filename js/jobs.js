function loadTransferTable(transferList, jobId){
	$('#' + jobId + '-loading-indicator').hide();
	$('#' + jobId + '-table-details').show();
	$("#" + jobId + "-table-details > tbody").html("");
	$.each(transferList, function(index, value){
		//Transfer row
		var t_row = '<tr class="' + getRowColor(value.file_state) + '">' ;
		var showPopover = getPopoverText(value);
		if (showPopover == null){
			t_row += getColumn(value.file_id);
		} else {
			t_row += getColumn('<a id="popover' + value.file_id  + '" href="#" class="btn" data-content="' + getPopoverText(value) + '" rel="popover" data-placement="right" data-trigger="hover" data-html="true">' + value.file_id + '</a>');					
		}
		t_row += getColumn(value.transferhost)	+ getColumn(value.source_surl) + getColumn(value.dest_surl) + getColumn(value.filesize) 
		+ getColumn(value.throughput) + getColumn(value.start_time).replace("T", " ") + getColumn(value.finish_time).replace("T", " ") 
		+ '</tr>'  ;		
		$("#" + jobId + "-table-details > tbody:last").append(t_row);
	});
	$.each(transferList, function(index, value){	
		$('#popover' + value.file_id ).popover();	
	});
}

function loadJobTable(jobList){
	$("#jobResultsTable > tbody").html("");
	jobList.sort(function(a,b) { return new Date(b.submit_time) - new Date(a.submit_time); } );
	$.each(jobList, function(index, value){
		//Job row
		var t_row = '<tr class="' + getRowColor(value.job_state) + ' accordion-body" data-toggle="collapse" id="' + value.job_id 
		+ '" data-target="#' + value.job_id + '_row" onclick="toogleDetailRowState(\'' + value.job_id + '_row\', \'' + value.job_id + '\')">';
		
		t_row += "<td>" + value.job_id + setResubmitButton(value.job_id, isFinalState(value.job_state), value.overwrite_flag, value.verify_checksum, isErrorState(value.job_state)) + "</td>";
		//check if multihop
		if (value.source_se === "null" || value.dest_se === null) {	
			source_se = getColumn("Multiple Sources");
			dest_se= getColumn("Multiple Destinations");
		}
		else {
			source_se = getColumn(value.source_se);
			dest_se = getColumn(value.dest_se);
		} 
		t_row += getColumn(value.submit_time) + source_se + dest_se + '</tr>'  ;
		
		$("#jobResultsTable > tbody:last").append(t_row);
		
		//Transfers from job row (hidden by default)
		t_row = '<tr class="collapse out" style="display: none;" id="' + value.job_id + '_row"><td colspan="4" >';
		t_row += '<div id="' + value.job_id + '-loading-indicator" style="display:none" class="row"><ul class="pager"><li><label class="text-center">'
				+ 'Loading...</label>&nbsp;<img class="pagination-centered" src="img/ajax-loader.gif"/></li></ul></div>';		
		t_row += '<table id="' + value.job_id + '-table-details" class="table table-bordered table-condensed table-hover transfers-table">';
		t_row += '<thead><tr><th style="width: 6%;">File ID</th><th style="width: 10%;">Transfer Host</th><th style="width: 25%;">Source URL</th>';
		t_row += '<th style="width: 25%;">Dest. URL</th><th style="width: 9%;">File Size (Bytes)</th>';
		t_row += '<th style="width: 9%;">Throughput (MB/s)</th><th style="width: 8%;">Start Time</th><th style="width: 8%;">End Time</th></tr></thead><tbody></tbody></table>'; 
		t_row += '</td></tr>';
		$("#jobResultsTable > tbody:last").append(t_row);
		//check if it's already expanded
		if (getRowExpanded(value.job_id + '_row') === "true") {
			toogleDetailRowState( value.job_id + '_row', value.job_id);
		}
	});
}

function setResubmitButton(delegation_id, is_final_State, overwrite, verify_checksum,failed){
	var row = '<div class="btn-group pull-right">'
	var resubmitAll = true;
	if (!is_final_State){
		row += '<button type="button" class="btn btn-xs btn-primary" onclick="removeTransfer(\'' + delegation_id  + '\')"><i class="glyphicon glyphicon-remove"/>&nbsp;Cancel</button>&nbsp;';
	}
	row += '<button type="button" class="btn btn-xs btn-primary" onclick="resubmitJob(\'' + delegation_id  + '\',\'' + overwrite + '\', \''+ verify_checksum + '\', \''+ resubmitAll + '\')"><i class="glyphicon glyphicon-cloud-upload"/>&nbsp;Resubmit Job</button>'

	if(failed) {
		resubmitAll = false;
		row +=' <button type="button" class="btn btn-xs btn-primary" onclick="resubmitJob(\'' + delegation_id  + '\',\'' + overwrite + '\', \''+ verify_checksum + '\', \''+ resubmitAll + '\')"><i class="glyphicon glyphicon-exclamation-sign"/>&nbsp;Resubmit Failed</button>'; 
	}
	
	row+='</div>';

	return row;
}

function getPopoverText(transfer){
	if ((transfer.reason != null) && (transfer.reason != "")){
		return '<strong>Error reason:</strong> ' + transfer.reason; 
	} 
	return null;
}

function reloadJobs(){
	console.log("reloading...");
	if (!sessionStorage.userCert){
                getDelegationID("delegation_id", false);
        }
        else {
                getDelegationIDSTS("delegation_id", false, sessionStorage.userCert, sessionStorage.userKey);
        }
}

function getColumn(columnName){
	return "<td>" + columnName + "</td>";
}

function isErrorState(job_state){
	return job_state=="FAILED" || job_state=="CANCELED" || job_state=="FINISHEDDIRTY";
}

function isFinalState(job_state){
	return isErrorState(job_state) || job_state=="FINISHED" || job_state=="FINISHEDDIRTY";
}

function getRowColor(job_state){
	if (job_state=="FAILED" || job_state=="CANCELED"){
		return "danger";		
	} else if (job_state=="FINISHED"){
		return "success";
	} else if (job_state=="FINISHEDDIRTY"){
		return "active";
	} else {
		return "warning";
	}
}

function showUserError(message){
	$('#serverErrorText').text(message);
	$('#serverkeyAlert').show();
}

function getJobDetail(rowId, jobId) {
        if ($("#jobResultsTable > tbody > #" + rowId).css('display') == 'none') {
                $("#jobResultsTable > tbody > #" + rowId).show();
                $('#' + jobId + '-table-details').hide();
                $('#' + jobId + '-loading-indicator').show();
                getJobTranfers(jobId, false, false, false, false);
        } else {
                $("#jobResultsTable > tbody > #" + rowId).hide();
        }
}

function toogleDetailRowState(rowId, jobId) {	
	if ($("#jobResultsTable > tbody > #" + rowId).css('display') == 'none') {
		$("#jobResultsTable > tbody > #" + rowId).show();
		$('#' + jobId + '-table-details').hide();
		$('#' + jobId + '-loading-indicator').show();		
		getJobTranfers(jobId, false, false, false, false);
		setRowExpanded(rowId, true);
	} else {
		$("#jobResultsTable > tbody > #" + rowId).hide();
		setRowExpanded(rowId, false);
	}
}	

function setRowExpanded(rowId, expanded) {
	 if(typeof(Storage)!=="undefined"){
		var name= rowId+'_expanded';
		sessionStorage.setItem(name,expanded);
	 }
}

function getRowExpanded(rowId) {
         if(typeof(Storage)!=="undefined"){
                var name= rowId+'_expanded';
                return sessionStorage.getItem(name);
         }
}

function resubmitJob(jobId, overwrite, checksum, resubmitAll){
	console.log("Resubmitting " + jobId);
	//Get transfers and submit them
	getJobTranfers(jobId, true, overwrite, checksum, resubmitAll);	
}

function rerunTransfer(data, overwrite, checksum, resubmitAll){	 
	var dropbox = false;
	var dropboxSuffix = "dropbox://";
	var lfcregistration = false;
	var dropboxTransfer = false;
	var lfcSuffix = "lfc://";
	var dropboxSuffix = "dropbox://www.dropbox.com";
	var theData = {};
	var resubmitAll= (resubmitAll ==='true');
	theData["files"] = [];       	      	  
	for (var i=0; i<data.length; i++){
		var files = {};
		files["sources"] = [];
		var dLists = [];
		dLists[0] = data[i].source_surl.trim();
		if (dLists[0].slice(0, dropboxSuffix.length) == dropboxSuffix)
			dropbox = true;
		if (!resubmitAll && (data[i].file_state.trim() === "FINISHED")) 
			continue;	
		if (dLists[0].slice(0, dropboxSuffix.length) == dropboxSuffix)
                        dropboxTransfer = true;
		files["sources"] = dLists;
		files["destinations"] = [];
		var dListd = [];
		dListd[0] = data[i].dest_surl.trim();
		if (dListd[0].slice(0, dropboxSuffix.length) == dropboxSuffix)
                        dropbox = true;
		if (dListd[0].slice(0, lfcSuffix.length) == lfcSuffix)
			lfcregistration = true;
		if (dListd[0].slice(0, dropboxSuffix.length) == dropboxSuffix)
			dropboxTransfer = true;
		files["destinations"] = dListd;
		theData["files"].push(files);		
	}
	theData["params"] = {};
	if (dropbox) {
		theData["params"].credential = "dropbox";
		theData["params"].verify_checksum = false;
		theData["params"].multihop = false;
	} else  {
        	theData["params"].verify_checksum = Boolean(checksum);
		theData["params"].multihop = lfcregistration;
	}
	theData["params"].overwrite = Boolean(overwrite);
	runDataTransfer($('#delegation_id').val(), theData);
    return false;
}
