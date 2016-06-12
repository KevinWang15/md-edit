/**
 * TODO: Image downloading/fetching from POST
 * TODO: Error Handling
 * TODO: Security - not run as root
 */


var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var path = require('path');
var app = express();
var exec = require('child_process').exec;
var busboy = require('connect-busboy');
const md5File = require('md5-file');

var hasHash = {};
// app.use(bodyParser.urlencoded({extended: true}));

app.use(busboy());

app.get('/', function (req, res) {
    res.send('Md2PDF server online');
});

if (!fs.existsSync('tmp'))
    fs.mkdirSync('tmp');

if (!fs.existsSync('tmp/upload'))
    fs.mkdirSync('tmp/upload');

var data = fs.readdirSync('tmp/upload');
data.forEach(function (item) {
    hasHash[path.basename(item).replace(path.extname(item), '')] = true;
});

app.post('/file-presence', bodyParser.urlencoded({extended: true}), function (req, res) {

    var ret = {};

    if (!req.body.list || !req.body) {
        res.send('{}');
        return;
    }

    req.body.list.forEach(function (file) {
        ret[file] = !!hasHash[file];
    });

    res.send(ret);
});

app.post('/upload', function (req, res) {
    var fstream;
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
        // console.log("Uploading: " + filename);
        var rnd = (Math.random() * (1 << 30)).toFixed(0);
        fstream = fs.createWriteStream(__dirname + '/tmp/upload/' + rnd);
        file.pipe(fstream);
        fstream.on('close', function () {
            var hash = md5File.sync(__dirname + '/tmp/upload/' + rnd);

            hasHash[hash] = true;

            fs.renameSync(__dirname + '/tmp/upload/' + rnd, __dirname + '/tmp/upload/' + hash + path.extname(filename));
            res.send('');
        });
    });

});

app.post('/convert', bodyParser.urlencoded({extended: true}), function (req, res) {
    var text = req.body.text;

    var fname = +new Date() + "_" + (Math.random() * 10000).toFixed(0);

    fs.writeFileSync(path.join('tmp', fname + '.md'), text, {encoding: 'utf8'});

    var pandoc = exec(
        [
            'pandoc',
            path.join('tmp', fname + '.md'),
            '-H assets/header.tex',
            '-V monofont="WenQuanYi Micro Hei"',
            '-V mainfont="WenQuanYi Micro Hei"',
            '-V geometry:"top=1.18cm, bottom=2.18cm, left=1.54cm, right=1.54cm"',
            '--latex-engine=xelatex',
            '--latex-engine-opt -shell-escape',
            '--filter pandoc-minted',
            '--listings',
            '-o ' + path.join('tmp', fname + '.tex')
        ].join(' ')
    );

    pandoc.stdout.pipe(process.stdout);
    pandoc.on('exit', function () {
        process.chdir('tmp');
        var xelatex = exec(
            [
                'xelatex',
                '-interaction=nonstopmode',
                '-shell-escape',
                fname + '.tex'
            ].join(' ')
        );

        xelatex.stdout.pipe(process.stdout);
        xelatex.on('exit', function () {

            res.set({
                "Content-Disposition": 'attachment; filename="' + (req.body.filename || 'generated') + '.pdf"'
            });

            res.sendFile(path.join(__dirname, 'tmp', fname + '.pdf'), {}, function () {
                fs.unlink(path.join(__dirname, 'tmp', fname + '.pdf'));
                fs.unlink(path.join(__dirname, 'tmp', fname + '.log'));
                fs.unlink(path.join(__dirname, 'tmp', fname + '.aux'));
                fs.unlink(path.join(__dirname, 'tmp', fname + '.out'));
                fs.unlink(path.join(__dirname, 'tmp', fname + '.pyg'));
                // fs.unlink(path.join(__dirname, 'tmp', fname + '.tex'));
                fs.unlink(path.join(__dirname, 'tmp', fname + '.md'));

                process.chdir('..');
            });
        });
    });

});

app.listen(13636, function () {
    console.log('Listening on port 13636');
});
