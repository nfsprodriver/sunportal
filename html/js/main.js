
var giga = Math.pow(10, 9);
var mega = Math.pow(10, 6);
var kilo = Math.pow(10, 3);

var Giga = "G";
var Mega = "M";
var Kilo = "k";

var maxDecimals = 2;

var reloadTime = 60000;		// reload once a minute

var lastDataSetLength = [];

var charts = [];

function setDataPoints(dataPoints, chart) {
	for (i = 0; i < dataPoints.length; i++) {
		addData(chart, dataPoints[i].time, dataPoints[i].power);
	}
}

function removeAllData(amount, chart) {
	for (i = 0; i < amount; i++) {
		removeData(chart);
	}
}

function removeData(chart) {
    chart.data.labels.pop();
    chart.data.datasets.forEach((dataset) => {
        dataset.data.pop();
    });
    chart.update();
}

function roundToDec(toRound, amount_of_decimals) {
	return Math.round(toRound*(Math.pow(10, amount_of_decimals))) / (Math.pow(10, amount_of_decimals));
}

function addPrefix(number) {
	if (number > giga) {
		return (roundToDec(number/giga, maxDecimals)) + " " + Giga;
	}
	else if (number > mega) {
		return (roundToDec(number/mega, maxDecimals)) + " " + Mega;
	}
	else if (number > kilo) {
		return (roundToDec(number/kilo, maxDecimals)) + " " + Kilo;
	}
	else {
		return roundToDec(number, maxDecimals) + " ";
	}
}

function initializeChart(ctx) {
	var new_chart = new Chart(ctx, {
	    type: 'line',
	    data: {
	        labels: [],
	        datasets: [{
	            label: 'Wh',
	            data: [],
	            backgroundColor: 'rgba(227,6,19,0.3)',
	            borderColor: 'rgba(227,6,19,1)',
	            borderWidth: 1,
	            pointRadius: 0
	        }]
	    },
	    options: {
	    	animation: {
	    		duration: 0
	    	},
	    	maintainAspectRatio: false,
	        scales: {
	            yAxes: [{
	                ticks: {
	                    beginAtZero:true,
	                    fontColor: 'rgba(255,255,255,1)',
	                    fontSize: 14
	                }
	            }],
	            xAxes: [{
	            	display: false,
	            	type: 'time',
	                ticks: {
	                    fontColor: 'rgba(255,255,255,1)'
	                }
	            }]
	        },
	        legend: {
	        	labels: {
	        		fontColor: 'rgba(255,255,255,1)'
	        	}
	        }
	    }
	});
	return new_chart;
}

function addData(chart, label, data) {
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(data);
    });
    chart.update();
}

function loadData() {
	$.ajax({type: 'post', dataType: "json", url: './update.php', success: function(response) {
		
		$('#dayTotal').html(addPrefix(response.dayTotal) + "Wh");
		$('#total').html(addPrefix(response.total*1000) + "Wh");
		$('#co2').html(addPrefix(response.co2) + "t");

		for (var name in response.inverters) {
			var serial = response.inverters[name].serial;

			//console.log(response.inverters[name]);

			if ( !$( "#chart-"+serial ).length ) {		// if chart not initialized

				$( "#charts" ).append( "<div class='chart col-12'><h5>"+name+"</h5><canvas id='"+"chart-"+serial+"' height='200px'/></div>" );
				//var ctx = $( "#"+"chart-"+serial ).getContext('2d');
				var ctx = document.getElementById( "chart-"+serial ).getContext('2d');
				charts[serial] = initializeChart(ctx);

				lastDataSetLength[serial] = 0;

			}

			// remove faulty values (probably caused by overflows in inverter)
			for (var i = 0; i < response.inverters[name].last24h.length; i++) {
				var data = response.inverters[name].last24h[i];
				if (data.power >= 10000000) { 						// faulty value was 145911144	
					console.log("found faulty value for inveter "+name+": ", response.inverters[name].last24h[i]);
					response.inverters[name].last24h.splice(i, 1); 	// remove
				}
			}

			removeAllData(lastDataSetLength[serial], charts[serial]);
			setDataPoints(response.inverters[name].last24h, charts[serial]);
			lastDataSetLength[serial] = response.inverters[name].last24h.length;
		}

	}
	});
}

loadData();
window.setInterval(loadData, reloadTime);	