var express = require('express');
var app = express();



app.get('/', function (req, res) {
  console.log("Got a GET request for the homepage");
  res.send('Hello GET');
})

app.get('/load', function (req, res) {
  var google = require('googleapis');
  var async = require('async');
  var fs = require('fs');

  var speech = google.speech('v1beta1').speech;

  function getAuthClient (callback) {
    google.auth.getApplicationDefault(function (err, authClient) {
      if (err) {
        return callback(err);
      }
      if (authClient.createScopedRequired && authClient.createScopedRequired()) {
        authClient = authClient.createScoped([
          'https://www.googleapis.com/auth/cloud-platform'
        ]);
      }

      return callback(null, authClient);
    });
  }

  function prepareRequest (inputFile, callback) {
    fs.readFile(inputFile, function (err, audioFile) {
      if (err) {
        return callback(err);
      }
      console.log('Got audio file!');
      var encoded = new Buffer(audioFile).toString('base64');
      var payload = {
        config: {
          encoding: 'LINEAR16',
          languageCode: 'fr-FR',
          sampleRate: 16000 //16000 ou 44100
        },
        audio: {
          content: encoded
        }
      };
      return callback(null, payload);
    });
  }

  function main (inputFile, callback) {
    var requestPayload;

    async.waterfall([
      function (cb) {
        prepareRequest(inputFile, cb);
      },
      function (payload, cb) {
        requestPayload = payload;
        getAuthClient(cb);
      },
      function sendRequest (authClient, cb) {
        console.log('Analyzing speech...');
        speech.syncrecognize({
          auth: authClient,
          resource: requestPayload
        }, function (err, result) {
          if (err) {
            return cb(err);
          }
          res.send(JSON.stringify(result, null, 2));
          console.log('result:', JSON.stringify(result, null, 2));

          cb(null, result);
        });
      }
    ], callback);
  }

  if (module === require.main) {
    if (process.argv.length < 2) {
      console.log('Usage: node recognize <inputFile>');
      process.exit();
    }
    var inputFile = "renaulttest.wav"; // ici
    main(inputFile, console.log);
  }

})
/*
var server = app.listen(8081, function () {
  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)
})
*/

// -----------------------------------------------------------------------


if (typeof localStorage === "undefined" || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}

app.get('/loadtest', function (req, res) {
  var google = require('googleapis');
  var async = require('async');
  var fs = require('fs');
  var recorder = require('./recorder')

  var speech = google.speech('v1beta1').speech;

  function getAuthClient (callback) {
    google.auth.getApplicationDefault(function (err, authClient) {
      if (err) {
        return callback(err);
      }
      if (authClient.createScopedRequired && authClient.createScopedRequired()) {
        authClient = authClient.createScoped([
          'https://www.googleapis.com/auth/cloud-platform'
        ]);
      }

      return callback(null, authClient);
    });
  }

  function prepareRequest (inputFile, callback) {
//    fs.readFile("inputFile", function (err, audioFile) {
//      if (err) {
//        return callback(err);
 //     }
      console.log('Got audio file!');
      var encoded = new Buffer(inputFile).toString('base64');
      var payload = {
        config: {
          encoding: 'LINEAR16',
          languageCode: 'fr-FR',
          sampleRate: 44100 //16000 ou 44100
        },
        audio: {
          content: encoded
        }
      };
      return callback(null, payload);
 //   });
  }

  function main (inputFile, callback) {
    var requestPayload;

    async.waterfall([
      function (cb) {
        prepareRequest(inputFile, cb);
      },
      function (payload, cb) {
        requestPayload = payload;
        getAuthClient(cb);
      },
      function sendRequest (authClient, cb) {
        console.log('Analyzing speech...');
        speech.syncrecognize({
          auth: authClient,
          resource: requestPayload
        }, function (err, result) {
          if (err) {
            return cb(err);
          }
          res.send(JSON.stringify(result, null, 2));
          console.log('result:', JSON.stringify(result, null, 2));

          cb(null, result);
        });
      }
    ], callback);
  }

  if (module === require.main) {
    if (process.argv.length < 2) {
      console.log('Usage: node recognize <inputFile>');
      process.exit();
    }
    recorder && recorder.exportWAV(function(blob) {
      var url = URL.createObjectURL(blob);
      var au = localStorage.getItem("audfile");
      var hf = localStorage.getItem("hfaudfile");

      au.controls = true;
      au.src = url;
      hf.href = url;
//      hf.download = new Date().toISOString() + '.wav';
      hf.download = 'file.wav'; //nom
    });
   // var inputFile = au; // ici
    main(hf.download, console.log);
  }

})

var server = app.listen(8081, function () {
  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)
})
