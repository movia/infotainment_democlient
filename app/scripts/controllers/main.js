'use strict';

/**
 * @ngdoc function
 * @name moviabusApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the moviabusApp
 */
angular.module('moviabusApp')
//filter checks the type of transport of each connection
.filter('checkType', function($moment) {
	return function(connections, type) {
		var out = [];
		if (!connections) {
			return;
		}
		var now = $moment();
		for (var i = 0; i < connections.length; i++) {
			var lineType, time,  regEx, l, des;
			var then = $moment(connections[i].expectedDepartureDateTime);
			var difference=$moment().diff(then, 'minutes');
			difference = Math.abs(difference);
			if (difference>60){difference=60;}
			connections[i].timeLeft = difference;
			if (connections[i].transportType === type) {
				switch (connections[i].transportType) {
					case 'BUS':
						connections[i].lineType = connections[i].lineTypeCode;
						break;
					case 'S-TOG':
						lineType = connections[i].lineDesignation.toLowerCase() + '-tog';
						connections[i].lineType = lineType;
						break;
					case 'METRO':
						lineType = connections[i].lineDesignation.slice(connections[i].lineDesignation.length - 2);
						connections[i].lineDesignation = lineType;
						connections[i].lineType = lineType;
						break;
					case 'TOG':
						des = connections[i].lineDesignation;
						l = des.split(' ');
						lineType = l[0];
						connections[i].lineDesignation = lineType;
						connections[i].lineType = lineType.toLowerCase();
						break;
				}
				out.push(connections[i]);
			}
		}
		return out;
	};
})
	// factory used for the navigation menu in order to show/hide transport types
	.factory('getTransport',
		function() {
			var bus = true;
			var stog = true;
			var metro = true;
			var tog = true;
			return {
				toggleTransport: function(transport) {
					switch (transport) {
						case 'BUS':
							bus = !bus;
							break;
						case 'S-TOG':
							stog = !stog;
							break;
						case 'METRO':
							metro = !metro;
							break;
						case 'TOG':
							tog = !tog;
							break;
					}
				},
				returnTransport: function(transport) {
					switch (transport) {
						case 'BUS':
							return bus;
						case 'S-TOG':
							return stog;
						case 'METRO':
							return metro;
						case 'TOG':
							return tog;
					}
				}
			};
		}
)
	//uses a standard number as init bus number, otherwise gets or sets the bus to be searched for
	.factory('busNumber', function() {
		var busNumber = '8478';
		return {
			getBusNumber: function() {
				return busNumber;
			},
			setBusNumber: function(no) {
				if (no !== '') {
					busNumber = no;
				}

			}
		};
	})
	//checks the time left in order to display "now" if less than 1 minutes is left
	.factory('transportTimeLeft', function() {
		return {
			getTimeLeft: function(timeLeft) {
				if (timeLeft < 1) {
					
					return true;
				} else {
					return false;
				}

			}
		};
	})
	//main controller
	.controller('MainCtrl', ['$scope', '$interval', '$timeout', 'getBus', 'getTransport', 'busNumber', 'transportTimeLeft',

		function($scope, $interval, $timeout, getBus, getTransport, busNumber, transportTimeLeft) {

			$scope.bus = busNumber.getBusNumber();
			$scope.busInfo = {};
			$scope.showBus = getTransport.returnTransport('BUS');
			$scope.showStog = getTransport.returnTransport('S-TOG');
			$scope.showMetro = getTransport.returnTransport('METRO');
			$scope.showTog = getTransport.returnTransport('TOG');
			$scope.newBus = '';

			//function used for styling connections
			$scope.isEven = function(conIndex){
				if(conIndex%2===0){return true;}
				else {return false;}
					
			};
			// sometimes server  shows connections which have left already, this is used to calculate it
			$scope.negTime = function(timeLeft) {
				return transportTimeLeft.getTimeLeft(timeLeft);
			};
			// searches a new bus
			$scope.searchNew = function() {
				if ($scope.newBus !== '') {
					busNumber.setBusNumber($scope.newBus);
				}
			};
			//toggles transport types
			$scope.toggle = function(transport) {
				getTransport.toggleTransport(transport);
				switch (transport) {
					case 'BUS':
						$scope.showBus = getTransport.returnTransport('BUS');
						break;
					case 'S-TOG':
						$scope.showStog = getTransport.returnTransport('S-TOG');
						break;
					case 'METRO':
						$scope.showMetro = getTransport.returnTransport('METRO');
						break;
					case 'TOG':
						$scope.showTog = getTransport.returnTransport('TOG');
						break;
				}
			};
			//for display mode 4 we must calculate if there's more than 1 connection, in order display 2 title columns 
			//this is also used to calculate screen size and won't display 2 title columns for small devices
			$scope.moreThanOne= function(connections, type){
				var w=screen.width;
				$scope.showBus = getTransport.returnTransport('BUS');
				var n = 0;
				if(!connections){
					return;
				}
				for (var i = 0; i < connections.length; i++) {
					if (connections[i].transportType === type) {
						n++;
					}

				}
				if(n===1 || w<992){return false;}
					else {return true;}

			};
			//used to calculate if there are connections for each transport type, and if not, title will not be shown
			//takes the toggle into account and hides the whole column if transport is hidden by user
			$scope.computeTransportType = function(connections, type) {
				$scope.showBus = getTransport.returnTransport('BUS');
				$scope.showStog = getTransport.returnTransport('S-TOG');
				$scope.showMetro = getTransport.returnTransport('METRO');
				$scope.showTog = getTransport.returnTransport('TOG');
				var n = 0;
				if (!connections) {
					return;
				}
				for (var i = 0; i < connections.length; i++) {
					if (connections[i].transportType === type) {
						n++;
					}
				}
				switch (type) {
					case 'BUS':
						if (n === 0) {
							return false;
						} else {
							if ($scope.showBus === true) {
								return true;
							} else {
								return false;
							}
						}
						break;
					case 'S-TOG':
						if (n === 0) {
							return false;
						} else {
							if ($scope.showStog === true) {
								return true;
							} else {
								return false;
							}
						}
						break;
					case 'METRO':
						if (n === 0) {
							return false;
						} else {
							if ($scope.showMetro === true) {
								return true;
							} else {
								return false;
							}
						}
						break;
					case 'TOG':
						if (n === 0) {
							return false;
						} else {
							if ($scope.showTog === true) {
								return true;
							} else {
								return false;
							}
						}
						break;
				}
			};
			//the interval is used to refresh the data each 5 seconds(5000 ms)  by calling a post request to the API through the getBus factory
			//this factory is in a separate file, getbus.js
			$interval(function() {
				var bus = busNumber.getBusNumber();
				$scope.getOneBus = getBus.getBusInfo(bus)
					.then(function(response) {
						if (response.status === 200) {
							$scope.busInfo = response.data;
						} else {
							console.log('Error occured' + response.status);
						}

					});
			}, 5000);// if the refresh rate needs to be changed, change this value 

		}
	]);