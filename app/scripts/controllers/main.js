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
		for (var i = 0; i < connections.length; i++) {
			var lineType, l, des;
			var then = $moment(connections[i].expectedDepartureDateTime);
			var difference=$moment().diff(then, 'minutes');
			difference = Math.abs(difference);
			if (difference>60){difference=60;}
      connections[i].timeLeft = difference;

      if (typeof connections[i].plannedDepartureDateTime !== "undefined") {
        connections[i].delayedMinutes = $moment(connections[i].expectedDepartureDateTime).diff($moment(connections[i].plannedDepartureDateTime), 'minutes');
      }
			if (connections[i].transportModeCode === type) {
				switch (connections[i].transportModeCode) {
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
.filter('uniqueCombo', function() {
	return function(connections, combo) {
    // Combos already added
    var added = [];
		var out = [];
		if (!connections) {
			return;
		}
		for (var i = 0; i < connections.length; i++) {
      var currentCombo = '';
		  for (var c = 0; c < combo.length; c++) {
        currentCombo = currentCombo + connections[i][combo[c]] + '-';
      }
      if (added.indexOf(currentCombo) === -1) {
        out.push(connections[i]);
        added.push(currentCombo);
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
	.controller('MainCtrl', ['$scope', '$interval', '$timeout', 'getBus', 'getTransport', 'busNumber', 'transportTimeLeft', '$moment', '$filter',

		function($scope, $interval, $timeout, getBus, getTransport, busNumber, transportTimeLeft, $moment, $filter) {

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
			// check if connections has transport type
			$scope.hasTransportType = function(connections, type) {
        if (!connections) {
          return false;
        }
        for (var i = 0; i < connections.length; i++) {
          if (connections[i].transportModeCode === type) {
            return true;
          }
        }
        return false;
			};
			$scope.diffMinutes = function(dateTime) {
          var then = $moment(dateTime);
          var difference = then.diff($moment(), 'minutes');

          return difference;
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

        // Reset rotation
        if ($scope.busInfo.displayMode == 4 || $scope.busInfo.displayMode == 5) {
          $scope.stopRotateFullConnectionView();
          $scope.rotateFullConnectionView();
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
					if (connections[i].transportModeCode === type) {
						n++;
					}

				}
				if(n===1 || w<992){return false;}
					else {return true;}

			};
			//get current count of visible transport types
			$scope.transportModeCount = function(connections) {

        var BUS = $scope.computeTransportModeCode(connections, 'BUS') && (typeof window.rotateItems === "undefined" || window.rotateItems.indexOf('BUS') !== -1);
        var STOG = $scope.computeTransportModeCode(connections, 'S-TOG') && (typeof window.rotateItems === "undefined" || window.rotateItems.indexOf('BUS') !== -1);
        var METRO = $scope.computeTransportModeCode(connections, 'METRO') && (typeof window.rotateItems === "undefined" || window.rotateItems.indexOf('BUS') !== -1);
        var TOG = $scope.computeTransportModeCode(connections, 'TOG') && (typeof window.rotateItems === "undefined" || window.rotateItems.indexOf('BUS') !== -1);

        var activated = [BUS,STOG,METRO,TOG].filter(Boolean).length;

        return activated;
      };
			//used to calculate if there are connections for each transport type, and if not, title will not be shown
			//takes the toggle into account and hides the whole column if transport is hidden by user
			$scope.computeTransportModeCode = function(connections, type) {
				$scope.showBus = getTransport.returnTransport('BUS');
				$scope.showStog = getTransport.returnTransport('S-TOG');
				$scope.showMetro = getTransport.returnTransport('METRO');
				$scope.showTog = getTransport.returnTransport('TOG');
				var n = 0;
				if (!connections) {
					return;
				}
				for (var i = 0; i < connections.length; i++) {
					if (connections[i].transportModeCode === type) {
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

      /**
       * Rotates connection types in full connection view
       *
       * @return {void}
       */
      $scope.rotateFullConnectionView = function() { // $scope, $interval, $filter
        if (typeof window.rotating !== "undefined" && window.rotating === true) {
          return;
        }

        var differentTypes = $filter('uniqueCombo')($scope.busInfo.nextStops[0].connections,['transportModeCode']);
        if (differentTypes.length <= 2) {
          return;
        }

        var rotateItems = [];
        for (var i = 0; i < differentTypes.length; i++) {
          if ($scope.computeTransportModeCode(differentTypes, differentTypes[i].transportModeCode)) {
            rotateItems.push(differentTypes[i].transportModeCode);
          }
        }

        if (rotateItems.length <= 2) {
          return;
        }

        window.rotating = true;
        window.rotateCount = 0;
        window.rotateItems = rotateItems;

        var rotateInterval = function() {
          // Always show bus when 3 rotateitems
          var busIndex = window.rotateItems.indexOf('BUS');
          if (window.rotateItems.length === 3 && busIndex !== -1) {
            var withoutBus = Array.from(window.rotateItems);
            withoutBus.splice(busIndex, 1);

            window.showRotateItems = ['BUS', withoutBus[window.rotateCount]];
            window.rotateCount += 1;
            if (window.rotateCount >= withoutBus.length) {
              window.rotateCount = 0;
            }
          } else {
            window.showRotateItems = window.rotateItems.slice(window.rotateCount, (window.rotateCount+2));
            window.rotateCount += 2;
            if ((window.rotateCount+1) > window.rotateItems.length) {
              window.rotateCount = 0;
            }
          }

        };

        rotateInterval();
        window.rotateInterval = $interval(rotateInterval, 10000);
      };

      /**
       * Stopping rotation of connection types in full connection view
       *
       * @return {void}
       */
      $scope.stopRotateFullConnectionView = function() {
        window.rotating = false;
        window.showRotateItems = [];
        $interval.cancel(window.rotateInterval);
      };

      /**
       * Stopping rotation of connection types in full connection view
       *
       * @param {string} item
       * @return {bool}
       */
      $scope.showRotateItem = function(item) {
        if (typeof window.rotating === "undefined" || window.rotating === false) {
          return true;
        }

        if (typeof window.showRotateItems !== "undefined" && window.showRotateItems.indexOf(item) !== -1) {
          return true;
        }

        return false;
      };

      /**
       * Handle rotation of messages
       *
       * @return {bool}
       */
      $scope.updateMessageRotation = function() {
        if (typeof $scope.busInfo.messages !== "undefined" && $scope.busInfo.messages !== null && $scope.busInfo.messages.length) {

          // If the rotating deviationMessages is not equal to the deviation messages
          // from the API rerun the rotations
          if (JSON.stringify(window.deviationMessages) !== JSON.stringify($scope.busInfo.messages)) {
            $scope.cancelMessageRotation();
            window.deviationMessages = $scope.busInfo.messages;

            window.deviationMessageIntervals = [];
            for (var c = 0; c < window.deviationMessages.length; c++) {
              var deviationMessage = window.deviationMessages[c];

              var initiateMessageInterval = function (deviationMessage) {
                var showMessage = function (deviationMessage) {
                  window.deviationMessage = deviationMessage;

                  $timeout(function () {
                    window.deviationMessage = null;
                  }, 20000);
                };

                // Fire right away
                showMessage(deviationMessage);

                // Add interval
                var intervalTime = (parseInt(deviationMessage.repeatIntervalMinutes) * 60 * 1000);

                if (typeof window.deviationMessageIntervals === "undefined") {
                  window.deviationMessageIntervals = [];
                }

                var interval = $interval(showMessage(deviationMessage), intervalTime);
                window.deviationMessageIntervals.push(interval);
              };

              // Fire each message with 22 seconds delay, so that they do not show up
              // at the same time
              $timeout(initiateMessageInterval.bind(null, deviationMessage), (c*22000));
            }

            return true;
          } else {
            return true;
          }
        }

        return $scope.cancelMessageRotation();
      };

      /**
       * Cancel all rotation of deviation messages
       *
       * @return {bool}
       */
      $scope.cancelMessageRotation = function() {
        if (typeof window.deviationMessageIntervals === "undefined" || window.deviationMessageIntervals.length === 0) {
          return false;
        }

        for (var i = 0; i < window.deviationMessageIntervals.length; i++) {
          $interval.cancel(window.deviationMessageIntervals[i]);
        }
        window.deviationMessage = null;
        delete window.deviationMessageIntervals;

        return true;
      };

      /**
       * @return {bool|object}
       */
      $scope.getDeviationMessage = function () {
        if (typeof window.deviationMessage !== "undefined" && window.deviationMessage !== null) {
          return window.deviationMessage;
        }

        return false;
      }

			//the interval is used to refresh the data each 5 seconds(5000 ms)  by calling a post request to the API through the getBus factory
			//this factory is in a separate file, getbus.js
			$interval(function() {
        var bus = busNumber.getBusNumber();
				$scope.getOneBus = getBus.getBusInfo(bus)
					.then(function(response) {
						if (response.status === 200) {
              $scope.busInfo = response.data;

              if (response.data.displayMode == 4 || response.data.displayMode == 5) {
                $scope.rotateFullConnectionView();
              } else {
                $scope.stopRotateFullConnectionView();
              }

              $scope.updateMessageRotation();
						} else {
							console.log('Error occured' + response.status);
						}
					});
			}, 5000);// if the refresh rate needs to be changed, change this value

		}
	]);
