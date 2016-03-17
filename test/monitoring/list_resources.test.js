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
var ListResources = require('../../monitoring/list_resources');
var PROJECT_RESOURCE = 'projects/cloud-monitoring-dev';
var authClient;

describe('monitoring/list_resources', function() {

  before(function(done) {
    ListResources.getMonitoringClient(function(client) {
      authClient = client;
      done();
    });
  });

  it('should list resources', function(done) {
    ListResources.listMonitoredResourceDescriptors(
      authClient, PROJECT_RESOURCE,
      function(monitoredResources) {
        var str = JSON.stringify(monitoredResources);
        assert(str.indexOf('An application running') > -1);
        done();
      });
  });

  it('should list metric descriptors', function(done) {
    ListResources.listMetricDescriptors(authClient, PROJECT_RESOURCE,
      function(metricDescriptors) {
        var str = JSON.stringify(metricDescriptors);
        assert(str.indexOf('Delta CPU usage') > -1);
        done();
      });
  });

  it('should list timeseries', function(done) {
    ListResources.listTimeseries(authClient,
      PROJECT_RESOURCE, function(timeSeries) {
        var str = JSON.stringify(timeSeries);
        assert(str.indexOf('timeSeries') > -1);
        done();
      });
  });
});
