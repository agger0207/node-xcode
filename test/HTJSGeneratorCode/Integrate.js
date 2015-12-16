// API is a bit wonky right now
var project = require('../../lib/pbxProject.js'),
    fs = require('fs'),
    projectPath = 'HTJSGeneratorCode.xcodeproj/project.pbxproj',
    myProj = project(projectPath);

// parsing is async, in a different process
myProj.parse(function (err) {
    console.log(myProj);

    var keyByName = myProj.findPBXGroupKey({ path: 'HTJSGeneratorCode'});
    console.log("keyByName" + keyByName);

    myProj.removeFile('Models/HTTestModel.h', {}, keyByName);
    myProj.removeFile('Models/HTTestModel.m', keyByName, {});

    myProj.addHeaderFile('Models/HTTestModel.h', {}, keyByName);
    myProj.addFile('Models/HTTestModel.m', keyByName, {});

    //myProj.removeFile('Models/HTTestModel.h', {}, 'HTJSGeneratorCode');
    //myProj.removeFile('Models/HTTestModel.m', 'HTJSGeneratorCode', {});
    //
    //myProj.addHeaderFile('Models/HTTestModel.h', {}, 'HTJSGeneratorCode');
    //myProj.addFile('Models/HTTestModel.m', 'HTJSGeneratorCode', {});

    fs.writeFileSync(projectPath, myProj.writeSync());
    console.log('new project written 111');
});