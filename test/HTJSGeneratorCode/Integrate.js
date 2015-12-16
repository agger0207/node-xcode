// API is a bit wonky right now
var project = require('../../lib/pbxProject.js'),
    fs = require('fs'),
    projectPath = 'HTJSGeneratorCode.xcodeproj/project.pbxproj',
    myProj = project(projectPath);

// parsing is async, in a different process
myProj.parse(function (err) {
    console.log(myProj);

    myProj.removeFile('Models/HTTestModel.h', {}, 'HTJSGeneratorCode');
    myProj.removeFile('Models/HTTestModel.m', 'HTJSGeneratorCode', {});

    myProj.addHeaderFile('Models/HTTestModel.h', {}, 'HTJSGeneratorCode');
    myProj.addFile('Models/HTTestModel.m', 'HTJSGeneratorCode', {});

    fs.writeFileSync(projectPath, myProj.writeSync());
    console.log('new project written 111');
});