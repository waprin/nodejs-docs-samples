// Copyright 2016, Google, Inc.
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

var async = require('async');
var google = require('googleapis');
var tables = google.bigquery('v2').tables;

var args = process.argv.slice(2);

if (!args.length) {
  throw new Error('Usage: node dataset_size.js <projectId> <datasetId>');
}
var projectId = args[0];
var datasetId = args[1];

function auth (callback) {
  google.auth.getApplicationDefault(function(err, authClient) {
    if (err) {
      return callback(err);
    }
    // The createScopedRequired method returns true when running on GAE or a
    // local developer machine. In that case, the desired scopes must be passed
    // in manually. When the code is  running in GCE or a Managed VM, the scopes
    // are pulled from the GCE metadata server.
    // See https://cloud.google.com/compute/docs/authentication for more
    // information.
    if (authClient.createScopedRequired && authClient.createScopedRequired()) {
      // Scopes can be specified either as an array or as a single,
      // space-delimited string.
      authClient = authClient.createScoped([
        'https://www.googleapis.com/auth/prediction'
      ]);
    }
    callback(null, authClient);
  });
}

function getTables(authClient, projectId, datasetId, pageToken, callback) {
  var params = {
    auth: authClient,
    projectId: projectId,
    datasetId: datasetId
  }
  if (pageToken !== undefined) {
    params.pageToken = pageToken;
  }
  tables.list(params, function (err, apiResponse) {
    if (err) {
      return callback(err);
    }
    var tablesList = apiResponse.tables;
    var token = apiResponse.nextPageToken;
    if (token) {
      return getTables(authClient, projectId, datasetId, token, function (err, _tablesList) {
        if (err) {
          return callback(err);
        }
        return callback(null, tablesList.concat(_tablesList));
      })
    } else {
      return callback(null, tablesList);
    }
  });
}

function getSize(projectId, datasetId, callback) {
  auth(function(err, authClient) {
    if (err) {
      return callback(err);
    }
    getTables(authClient, projectId, datasetId, null, function (err, tablesList) {
      return async.parallel(tablesList.map(function (table) {
        // console.log('table', table);
        return function (cb) {
          tables.get({
            auth: authClient,
            projectId: projectId,
            datasetId: datasetId,
            tableId: table.tableReference.tableId
          }, function (err, tableInfo) {
            if (err) {
              return cb(err);
            }
            return cb(null, (parseInt(tableInfo.numBytes, 10) / 1000) / 1000);
          })
        };
      }), function (err, sizes) {
        if (err) {
          return callback(err);
        }
        var sum = 0;
        sizes.forEach(function (size) {
          sum += size;
        });
        return callback(null, sum);
      });
    });
  });
}

exports.getSize = getSize;

if (module === require.main) {
  getSize(projectId, datasetId, function (err, sum) {
    if (err) {
      return console.log(err);
    }
    var size = 'MB';
    if (sum > 1000) {
      sum = sum / 1000;
      size = 'GB';
    }
    if (sum > 1000) {
      sum = sum / 1000;
      size = 'TB';
    }
    console.log('' + sum.toPrecision(5) + ' ' + size);
  });
}
