// Copyright 2015-2016, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

var assert = require('assert');
var async = require('async');
var CustomMetrics = require('../../monitoring/create_custom_metric');
var authClient;

var customMetrics = new CustomMetrics('cloud-monitoring-dev',
  Math.random().toString(36).substring(7));
// makes written value always equal to 3
customMetrics.valueOverride = true;

describe('monitoring/create_custom_metric', function() {

  before(function(done) {
    customMetrics.getMonitoringClient(function(client) {
      authClient = client;
      done();
    });
  });

  it('should create and read back a custom metric', function(done) {

    /** Refactored out to keep lines shorter */
    function getPointValue(timeSeries) {
      return timeSeries.timeSeries[0].points[0].value.int64Value;
    }

    async.series([
      function(callback) {
        customMetrics.createCustomMetric(authClient, function() {
          callback();
        });
      }, function(callback) {
        // wait for the metric to be created
        setTimeout(function() {
          customMetrics.writeTimeSeriesForCustomMetric(
            authClient, function() {
              callback();
            });
        }, 2000);
      }, function() {
        // wait for the write to be received
        setTimeout(function() {
          customMetrics.listTimeSeries(
            authClient, function(timeSeries) {
              assert.equal(getPointValue(timeSeries, 3));
              done();
            });
        }, 4000);
      }]);
  });
});


