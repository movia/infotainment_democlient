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
          var req = {
            method: 'GET',
            url: env.apiBaseUrl + '?url=' + encodeURIComponent('/infotainment/v3/vehicle/' + busNumber + '/2?includeNextStops=3'),
            headers: {
              'Authorization': 'Basic ' + btoa(env.apiUser+':'+env.apiPassword)
            }
          }

          return $http(req);
				}
			};

		}
	]);
