'use strict';

describe('Service: getBus', function () {

  // load the service's module
  beforeEach(module('moviabusApp'));

  // instantiate service
  var getBus;
  beforeEach(inject(function (_getBus_) {
    getBus = _getBus_;
  }));

  it('should do something', function () {
    expect(!!getBus).toBe(true);
  });

});
