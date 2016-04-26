var bundle = require('browserify')();
var fs = require('fs');

bundle.add('./index');
bundle.bundle({standalone: 'localMedia'}).pipe(fs.createWriteStream('localMedia.bundle.js'));
