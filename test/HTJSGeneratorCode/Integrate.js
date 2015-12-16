// API is a bit wonky right now
var project = require('../../lib/pbxProject.js'),
    fs = require('fs'),
    projectPath = 'HTJSGeneratorCode.xcodeproj/project.pbxproj',
    myProj = project(projectPath);

// Debug with parseSync as it is impossible to debug async parsing.
//myProj.parseSync();
//
//var keyByName = myProj.findPBXGroupKey({ path: 'HTJSGeneratorCode'});
//var requestGroupKey = myProj.pbxCreateGroup("Requests", "Requests");
//    group = myProj.addToPbxGroup(requestGroupKey, keyByName, {});
//console.log(group);
//fs.writeFileSync(projectPath, myProj.writeSync());

// parsing is async, in a different process
//myProj.parse(function (err) {
//    console.log(myProj);
//
//    var keyByName = myProj.findPBXGroupKey({ path: 'HTJSGeneratorCode'});
//    console.log("keyByName" + keyByName);
//    //
//
//    myProj.removeFile('Models/HTTestModel.h', {}, keyByName);
//    myProj.removeFile('Models/HTTestModel.m', keyByName, {});
//    //
//    myProj.addHeaderFile('Models/HTTestModel.h', {}, keyByName);
//    myProj.addFile('Models/HTTestModel.m', keyByName, {});
//    //
//
//    //myProj.removeFile('Models/HTTestModel.h', {}, 'HTJSGeneratorCode');
//    //myProj.removeFile('Models/HTTestModel.m', 'HTJSGeneratorCode', {});
//    //
//    //myProj.addHeaderFile('Models/HTTestModel.h', {}, 'HTJSGeneratorCode');
//    //myProj.addFile('Models/HTTestModel.m', 'HTJSGeneratorCode', {});
//
//    var modelGroupKey = myProj.pbxCreateGroup("Models", "Models");
//    var requestGroupKey = myProj.pbxCreateGroup("Requests", "Requests");
//    console.log("modelGroupKey: " + modelGroupKey + " requestGroupKey: " + requestGroupKey);
//
//    myProj.addToPbxGroup(requestGroupKey, 'HTJSGeneratorCode', {});
//
//    //var requestGroupKey = myProj.findPBXGroupKey( {path: "Requests"});
//    myProj.addSourceFile('HTTestRequest.m', requestGroupKey, {});
//
//    fs.writeFileSync(projectPath, myProj.writeSync());
//    console.log('new project written 111');
//});

myProj.parse(function (err) {
    console.log("Start update Project " + projectPath + " !");

    // Step 1: Find parent Group Key according to path. This group must be available in the project.
    // Model files and request files will be added into this group.
    // TODO: The path should be passed as a param.
    var parentGroupKey = myProj.findPBXGroupKey({ path: 'HTJSGeneratorCode'});
    console.log("parentGroupKey : " + parentGroupKey);

    // Step 2: Create group if it doesn't exist.
    // TODO: 1 Group name and path should be passed as params. 2 If the group already exists then it is uncessary to create and add them.
    var modelGroupKey = myProj.pbxCreateGroup("Models", "Models");
    var requestGroupKey = myProj.pbxCreateGroup("Requests", "Requests");

    // Step 3: Add new created groups into parent group.
    // Note: Currently it is not supported to put models and requests into different parent groups.
    myProj.addToPbxGroup(modelGroupKey, parentGroupKey, {});
    myProj.addToPbxGroup(requestGroupKey, parentGroupKey, {});

    // Step 4: Remove files from Group and Add files into Group.
    // TODO: 1 File path may not work if group directory doesn't match. 2 Loop directories to find files automatically.
    myProj.removeFile('Models/HTTestModel.h', {}, modelGroupKey);
    myProj.removeFile('Models/HTTestModel.m', modelGroupKey, {});
    myProj.addHeaderFile('Models/HTTestModel.h', {}, modelGroupKey);
    myProj.addSourceFile('Models/HTTestModel.m', {}, modelGroupKey);

    myProj.removeFile('Requests/HTTestRequest.h', {}, requestGroupKey);
    myProj.removeFile('Requests/HTTestRequest.m', requestGroupKey, {});
    myProj.addHeaderFile('Requests/HTTestRequest.h', {}, requestGroupKey);
    myProj.addSourceFile('Requests/HTTestRequest.m', {}, requestGroupKey);


    // Step 5: Write back to project.
    fs.writeFileSync(projectPath, myProj.writeSync());
    console.log('Project ' + projectPath + " is updated successfully !");
});