var url = phantom.args[0];
var callback_url = phantom.args[1];
var script = phantom.args.slice(2).join(' ');

if (!url || !script) {
  console.log('ghoulio v2.1');
  console.log('');
  console.log('Usage: ');
  console.log('  ghoulio URL CALLBACK_URL SCRIPT');
  console.log('');
  console.log('Use "resolve()" with SCRIPT to end the session');
  phantom.exit(1);
}

var webpage = require('webpage');
var page = webpage.create();

function callback(message, _callback) {
  if (!callback_url) {
    console.warn('No callback URL specified');
    return;
  }
  var page = webpage.create();
  page.open(callback_url + '?response=' + JSON.stringify(message), function(status) {
    if (status !== 'success') console.log(status);
    if (_callback) _callback(status);
  });
}

page.onConsoleMessage = function(msg) {
  if (msg.startsWith('*** EXIT SUCCESS ***')) {
    var data = JSON.parse(msg.substring(20));
    console.log(data);
    callback({success: true, data: data}, function() {
      phantom.exit(0);
    });
  } else if (msg.startsWith('*** EXIT FAILURE ***')) {
    var error = JSON.parse(msg.substring(20));
    console.error(error);
    callback({success: false, error: error}, function() {
      phantom.exit(1);
    });
  } else if (msg.startsWith('*** MESSAGE ***')) {
    var message = JSON.parse(msg.substring(15));
    console.log(message);
    callback({message: message});
  } else {
    console.log(msg);
  }
};

page
.open(url)
.then(function() {
  page.viewportSize = { width: 680, height: 680 };
  page.evaluate(function(script) {
    function callback(data) {
      return $.post(callback_url, {data: JSON.stringify(data)});
    }
    function resolve(data) {
      console.log('*** EXIT SUCCESS ***' + JSON.stringify(data));
    }
    function reject(e) {
      console.log('*** EXIT FAILURE ***' + JSON.stringify(e));
    }
    function callback(message) {
      console.log('*** MESSAGE ***' + JSON.stringify(message));
    }
    try {
      eval(script);
    } catch(e) {
      reject(e);
    }
  }, script);
});
