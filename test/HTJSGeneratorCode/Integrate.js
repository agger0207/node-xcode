// API is a bit wonky right now
var project = require('../../lib/pbxProject.js'),
    fs = require('fs'),
    projectPath = 'HTJSGeneratorCode.xcodeproj/project.pbxproj',
    myProj = project(projectPath);

// parsing is async, in a different process
myProj.parse(function (err) {
    // myProj.addHeaderFile('./HTJSGenerateCode/Models/HTTestModel.h');
    // myProj.addHeaderFile('./HTJSGenerateCode/Models/HTTestModel.m');
    // myProj.addFramework('FooKit.framework');

    console.log(myProj);

    myProj.addHeaderFile('Models/HTTestModel.h', {}, 'HTJSGeneratorCode');
    // myProj.addSourceFile('Models/HTTestModel.m', {}, 'HTJSGeneratorCode');
    myProj.addFile('Models/HTTestModel.m', 'HTJSGeneratorCode', {});

    fs.writeFileSync(projectPath, myProj.writeSync());
    console.log('new project written');
});