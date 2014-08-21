var ENTER_KEY = 13;
var config = {};
var PROCESSING = '#f65376';
var SUCCESS = '#33ff33';
var ERROR = 'red';
cloudantdata = [];
var options = { 
	title: 'Steps Acummulated',
	hAxis: {title: '#{config.period}', titleTextStyle: {color: 'black'}}
};

function responsivenessBeforeAjaxCall(msgElement) {
	//$('#no-ajax-call').attr('id', 'ajax-ongoing');
	$('.bottom-bg-color').css(
		'background-image','-webkit-linear-gradient(transparent,' + PROCESSING + ')'
	);
	$('.bottom-bg-color').css('animation-play-state', 'running');
	$('.bottom-bg-color').css('bottom', '0');
	msgElement.text('Retrieving requested data . . .');
}

function updateCharts(key, value) {
	var msgElement = $('#ajax-info-loading');
	responsivenessBeforeAjaxCall(msgElement);
	var infoColor = SUCCESS;

	$.ajax({
		type: 'POST',
		url: '/api/ajax/updateCharts?' + key + '=' + value
	}).done(function(response, textStatus, xhr) {
		console.log('updateConfig onreadystatechange response: ', response);

		if (response.error) {
			msgElement.text(resolveError(response));
			infoColor = ERROR;
		}
		else {
			updateChartData(response.chartData, response.chartConfig);
			msgElement.text('Chart ready!');
		}
		//document.ajaxForm.testajax.value = xmlhttp.response;
	}).fail(function(xhr, textStatus, errorThrown) {
		msgElement.text('Error: ', textStatus); 
		console.log('xhr:', xhr);
		console.log('textStatus:', textStatus);
		console.log('errorThrown:', errorThrown);
		infoColor = ERROR;
	}).always(function() {
		$('.bottom-bg-color').css('animation-play-state', 'paused');
		$('.bottom-bg-color').css(
			'background-image','linear-gradient(transparent,' + infoColor + ')'
		);
		TweenLite.fromTo($('.bottom-bg-color'),3,{bottom:0},{bottom:'-50px'});
	});
}

function updateChartData(newData, newConfig) {
	cloudantdata = newData;
	config = newConfig;
	options = getOptions();
	console.log('cloudantdata length:',cloudantdata.length);
	if(cloudantdata.length < 1)
		NoData();
	else
		drawChart();
}

function NoData() {
	console.log("No Data to plot");
	$('#chartdiv').text('No data matched to the current configuration.');
}

function drawChart() {
	console.log('typeof ', typeof cloudantdata);
	console.log(cloudantdata);
	var data = google.visualization.arrayToDataTable(cloudantdata); 
	var chart;

	var view = new google.visualization.DataView(data);
	view.setColumns([0,
	1, { calc: "stringify",
			sourceColumn: 1,
			type: "string",
			role: "annotation" },
	2, { calc: "stringify",
			sourceColumn: 2,
			type: "string",
			role: "annotation" },
	3, { calc: "stringify",
			sourceColumn: 3,
			type: "string",
			role: "annotation" },
	4, { calc: "stringify",
			sourceColumn: 4,
			type: "string",
			role: "annotation" },
	5, { calc: "stringify",
			sourceColumn: 5,
			type: "string",
			role: "annotation" }
	]);

	if (chart === undefined) 
		chart = new google.visualization.BarChart(document.getElementById('chartdiv'));
	chart.draw(view, options);
}

function getOptions() {
	var textStyle = {
		color: '#606060',
		fontName: 'Lato, sans-serif'
	};

	var options = {
		height : 100 * cloudantdata.length + 350,
		//width : screen.width,
		backgroundColor: '#f7f7f7',
		chartArea: {
			top: 50,
			bottom: 0,
			height: '100%'
		},
		title: config.patient + ' statistics',
		titleTextStyle: textStyle,
		textStyle: textStyle,
		fontSize: 18,
		fontName: textStyle.fontName,

		vAxis: {
			title: config.period,
			titleTextStyle: textStyle,
			textStyle: textStyle
		},
		hAxis: {
			title: "Steps Accumulated",
			titleTextStyle: textStyle,
			textStyle: textStyle,
		},
		legend: {
			textStyle: textStyle,
		},
		tooltip: {
			textStyle: textStyle
		}
	};
	return options;
}

function submitConfiguration(form) {
	console.log('submitConfiguration ', this);
	for (idx in form.elements) {
		console.log(idx, '=', form.elements[idx].value);
	}
	return false;
}

function resolveError(serverErr) {
	var errStr = "";
	if (serverErr.reason) {
		errStr = serverErr.reason;
		if (serverErr.error === 'not_found') {
			// && serverErr.reason === "Database does not exist." ) {
			errStr = "Patient does not exist in database.";
			//errStr = errStr.replace('Database','Patient').replace('.','') + ' in database.';
		}
	}
	return errStr;
}

function updateTime(key, date, hour) {
	if (date.length > 0) {
		if (hour.length > 0) {
			console.log(date, hour);
			dateString = date + ' ' + hour;
			dateObject = new Date(dateString);
			console.log(dateObject);
			updateCharts(key,dateObject.toISOString());
		} else {
			//$('#' + key + 'Hour').val("00:00");
			updateTime(key, date, "00:00");
		}
	}
}

Date.prototype.getDateTwoDigits = function() {
	var d = this.getDate();
	var dStr = d.toString();
	if (d < 10)
		dStr = '0' + dStr;
	return dStr;
}

Date.prototype.getMonthTwoDigits = function() {
	var m = this.getMonth() + 1;
	var mStr = m.toString();
	if (m < 10)
		mStr = '0' + mStr;
	return mStr;
}

DATESEPARATOR = '-';
function dateFormatdmy(date) {
	return date.getDateTwoDigits() + DATESEPARATOR + date.getMonthTwoDigits()
		+ DATESEPARATOR + date.getFullYear();
}

function dateFormatymd(date) {
	return date.getFullYear() + DATESEPARATOR +
		date.getMonthTwoDigits() + DATESEPARATOR + date.getDateTwoDigits();
}

function timeFormat(date) {
	return date.getHours() + ':' + date.getMinutes();
}

google.load("visualization", "1", {packages:["corechart"]});
google.setOnLoadCallback(init);

function init() {
	console.log('init function called');
	updateCharts("period", "default");
}

$().ready(function() {
	now = new Date();
	$('#endTimeDate').val(dateFormatymd(now));
	$('#endTimeHour').val(timeFormat(now));
	console.log(now,'as', dateFormatymd(now));
	now.setFullYear(now.getFullYear(), now.getMonth() - 1);
	$('#startTimeDate').val(dateFormatymd(now));
	$('#startTimeHour').val(timeFormat(now));

	// Event Handlers
	$('#startTimeDate, #startTimeHour').keyup(function(e) {
		if (e.which === ENTER_KEY) {
			updateTime("starttime", $('#startTimeDate').val(), $('#startTimeHour').val());
		}
	});

	// Update Chart on enter key release
	$('#startTimeDate, #startTimeHour, #endTimeDate, #endTimeHour').keyup(function(e) {
		if (e.which === ENTER_KEY) {
			updateTime("endtime", $('#endTimeDate').val(), $('#endTimeHour').val());
		}
	});

	$('#startTimeDate, #startTimeHour, #endTimeDate, #endTimeHour').change(function(e) {
		var e = jQuery.Event("keyup");
		e.which = ENTER_KEY;
		$(this).trigger(e);
	});

	$('.periodradiobuttons').click(function(e) {
		//console.log('period=', e.target.value);
		updateCharts("period", e.target.value);
	});

	$('header li.period-li a').click(function(e) {
		$('header li.period-li a').attr('id', '');
		$(this).attr('id','active');
		console.log('click from "' + e.target.text.replace(/\s+/g, '') + '"');
		updateCharts("period", e.target.text.replace(/\s+/g, ''));
	});

	$('header li.method-li a').click(function(e) {
		$('header li.method-li a').attr('id', '');
		$(this).attr('id','active');
		console.log('click from "' + e.target.text.replace(/\s+/g, '') + '"');
		updateCharts("method", e.target.text.replace(/\s+/g, ''));
	});

	$('#resolution').text('w' + $(window).width() + 'x' + $(window).height() + 'h');
	$(window).resize(function(e) {
		var resinfo = 'w' + $(window).width() + 'x' + $(window).height() + 'h';
		$('#resolution').text(resinfo);
	});
});
