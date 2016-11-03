var express = require('express');
var BinaryServer = require('binaryjs').BinaryServer;
var fs = require('fs');
var wav = require('wav');
var google = require('googleapis');
var async = require('async');

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
        sampleRate: 44100,
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
        console.log(JSON.stringify(result, null, 2));
        console.log('result:', JSON.stringify(result, null, 2));

        cb(null, result);
      });
    }
  ], callback);
}


var port = 3700;
var outFile = 'demo.wav';
var app = express();

app.set('views', __dirname + '/tpl');
app.set('view engine', 'jade');
app.engine('jade', require('jade').__express);
app.use(express.static(__dirname + '/public'))

app.get('/', function(req, res){
  res.render('index');
});

app.listen(port);

console.log('server open on port ' + port);

binaryServer = BinaryServer({port: 9001});

binaryServer.on('connection', function(client) {
  console.log('new connection');

  var fileWriter = new wav.FileWriter(outFile, {
    channels: 1,
    sampleRate: 44100,
//    bitDepth: 16
  });

  client.on('stream', function(stream, meta) {
    console.log('new stream');
    stream.pipe(fileWriter);

    stream.on('end', function() {
      fileWriter.end();
      console.log('wrote to file ' + outFile);
      main(outFile, console.log);
    });
  });
});
