#!/usr/bin/env node

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";


var assertFileExists = function(infile){
    var instr = infile.toString();
    if (!fs.existsSync(instr)){
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1);
    }

    return instr;
};

var loadChecks = function(checksfile){
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlString = function(htmlstring, checksfile){
    $ = cheerio.load(htmlstring);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks){
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }

    return out;
};

var checkUrlResponse = function(program){
    return function(result, response){
        if ( result instanceof Error ){
            var jsonError = {
                error: "Cannot download file from url"
            };
            console.log( JSON.stringify(jsonError) );
        } else {
            //console.log(result);
            checkAndPrintOutput(program, result);
        }
    }
};

var clone = function(fn){
    return fn.bind({});
};

var checkAndPrintOutput = function(program, htmlstring){
    var checkJson = checkHtmlString(htmlstring, program.checks);
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
}

if(require.main == module){
    program
        .option('-c --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <url>', 'URL to index.html', null, null)
        .parse(process.argv);

    if (program.url)
        rest.get(program.url).on('complete', checkUrlResponse(program));
    else {
        var htmlstring = fs.readFileSync(program.file).toString();
        checkAndPrintOutput(program, htmlstring);
    }


} else {
    exports.checkHtmlFile = checkHtmlFile;
}

