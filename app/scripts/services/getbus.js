'use strict';

/**
 * @ngdoc service
 * @name moviabusApp.getBus
 * @description
 * # getBus
 * Service in the moviabusApp.
 */
angular.module('moviabusApp')
	//used to call the API for the connections of the specific bus number
	.factory('getBus', ['$http',
		function($http) {
			return {
				getBusInfo: function(busNumber) {
					var promise = $http.get('https://wsilb.moviatrafik.dk/infotainment/v2/vehicle/' + busNumber);
					return promise;
				}
			};

		}
	]);