var express = require('express');
var morgan = require('morgan');
var path = require('path');

var fillTemplate = require('./fillTemplate.js');
var errorReport = require('./errorReport.js');
var checkJar = require('./checkJar.js');

var wdd = require('./weDeployData');

var showIndex = function showIndex(req, res) {
        res.sendFile(path.join(__dirname + '/public/index.html'));
};

var respondError = (req, res, url, report) => {
    res.status(report.statusCode);

    fillTemplate(res, 'public/error.html', (doc) => {
        if (report.failureType == 'failure.cannot_parse_template') {
            return '<p>Template error: ' + JSON.stringify(err);
        }

        var title = doc.getElementsByTagName("title");

        title[0].textContent = "We could not check " + url + " :(";

        var jarFile = doc.getElementsByClassName('jar-file');
        jarFile[0].textContent = url;

        var errorType = doc.getElementsByClassName('error-type');
        errorType[0].textContent = report.failureType;

        var errorData = doc.getElementsByClassName('error-data');
        errorData[0].innerHTML = report.errorData;

        return doc;
    });
};

var respondOK = (req, res, jarInfo) => {
    fillTemplate(res, 'public/jar-info.html', (doc) => {
        var title = doc.getElementsByTagName("title");

        title[0].textContent = "Is " + jarInfo.filenames[0] + " OSGI-ready?";

        var jarHash = doc.getElementsByClassName('jar-hash');

        for (var e of jarHash) {
            e.textContent = jarInfo.id;
        }

        var jarFiles = doc.getElementsByClassName('jar-file');

        for (var e of jarFiles) {
            e.textContent = jarInfo.filenames[0];
        }

        var jarURLs = doc.getElementsByClassName('jar-urls');

        jarURLs[0].innerHTML = '<li>' + jarInfo.urls[0] + '</li>';

        var jarIsOSGi = doc.getElementsByClassName('jar-is-osgi');

        jarIsOSGi[0].innerHTML = ""+ jarInfo.osgiready;

        return doc;
    });
};

var checkURL = function (req, res) {
    var url = req.query.url;

    checkJar(url)
    .then((jarInfo) => {
        respondOK(req, res, jarInfo);
    })
    .catch((report) => {
        respondError(req, res, url, report);
    });
}

var checkPOM = (req, res) => {
    var filepath = path.join(
        req.query.groupId.replace('.', '/'),
        req.query.artifactId,
        req.query.version,
        req.query.artifactId + '-' + req.query.version + '.jar'
    );

    var url = 'http://search.maven.org/remotecontent?filepath='+filepath;

    checkJar(url)
    .then((jarInfo) => {
        respondOK(req, res, jarInfo);
    })
    .catch((report) => {
        respondError(req, res, url, report);
    });
};

var app = express();

app.use(morgan('combined'));

app.get('/', showIndex);

app.get('/isit', checkURL);
app.get('/pomit', checkPOM);

app.listen(80, function () {
  console.log('Listening on port 80');
});

