// API is a bit wonky right now
var project = require('../../lib/pbxProject.js'),
    fs = require('fs'),
    projectPath = 'HTJSGeneratorCode.xcodeproj/project.pbxproj',
    myProj = project(projectPath);

// Debug with parseSync as it is impossible to debug async parsing.
myProj.parseSync();

//var requestGroupKey = myProj.findPBXGroupKey({path: 'HTJSGeneratorCode/Request'});
// /var requestGroupKey = myProj.findPBXGroupKey({path: 'HTJSGeneratorCode/Requests'});
// TODO: 如何找到绝对路径下的Group呢?
var requestGroupKey = myProj.findPBXGroupKey({path: 'Requests'});
if (requestGroupKey === undefined) {
    var keyByName = myProj.findPBXGroupKey({ path: 'HTJSGeneratorCode'});
    var requestGroupKey = myProj.pbxCreateGroup("Requests", "Requests");
    myProj.addToPbxGroup(requestGroupKey, keyByName, {});
    fs.writeFileSync(projectPath, myProj.writeSync());
} else {
    console.log("requestGroupKey is found successfullye: " + requestGroupKey);
    var parentGroupKey = myProj.findPBXGroupKey({ path: 'HTJSGeneratorCode'});

    // TODO:  这个老的方法只能删除文件,不能删除Group. 要自己重写.
    // 看情况, 删除Group的时候,还需要自己删除所有的文件.
    myProj.removeFromPbxGroup(requestGroupKey, parentGroupKey);

    // TODO: 同名的Group也会被删除. 而且只能按照名字来删除,不能按照Key来删除.
    myProj.removePbxGroup('Requests');

    fs.writeFileSync(projectPath, myProj.writeSync());
}

//
//exports.findGroupKey = {
//    'should return a valid group key':function(test) {
//        var keyByName = project.findPBXGroupKey({ name: 'Classes'});
//        var keyByPath = project.findPBXGroupKey({ path: 'icons'});
//        var keyByPathName = project.findPBXGroupKey({ path: '"HelloCordova/Plugins"', name: 'Plugins'});
//        var nonExistingKey = project.findPBXGroupKey({ name: 'Foo'});
//
//        test.ok(keyByName === '080E96DDFE201D6D7F000001');
//        test.ok(keyByPath === '308D052D1370CCF300D202BF');
//        test.ok(keyByPathName === '307C750510C5A3420062BCA9');
//        test.ok(nonExistingKey === undefined);
//
//        test.done();
//    }
//}

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

// 正式干净的代码
//
//myProj.parse(function (err) {
//    console.log("Start update Project " + projectPath + " !");
//
//    // Step 1: Find parent Group Key according to path. This group must be available in the project.
//    // Model files and request files will be added into this group.
//    // TODO: The path should be passed as a param.
//    var parentGroupKey = myProj.findPBXGroupKey({ path: 'HTJSGeneratorCode'});
//    console.log("parentGroupKey : " + parentGroupKey);
//
//    // Step 2: Create group if it doesn't exist.
//    // TODO: 1 Group name and path should be passed as params. 2 If the group already exists then it is uncessary to create and add them.
//    var modelGroupKey = myProj.pbxCreateGroup("Models", "Models");
//    var requestGroupKey = myProj.pbxCreateGroup("Requests", "Requests");
//
//    // Step 3: Add new created groups into parent group.
//    // Note: Currently it is not supported to put models and requests into different parent groups.
//    myProj.addToPbxGroup(modelGroupKey, parentGroupKey, {});
//    myProj.addToPbxGroup(requestGroupKey, parentGroupKey, {});
//
//    // Step 4: Remove files from Group and Add files into Group.
//    // TODO: 1 File path may not work if group directory doesn't match. 2 Loop directories to find files automatically.
//    myProj.removeFile('Models/HTTestModel.h', {}, modelGroupKey);
//    myProj.removeFile('Models/HTTestModel.m', modelGroupKey, {});
//    myProj.addHeaderFile('Models/HTTestModel.h', {}, modelGroupKey);
//    myProj.addSourceFile('Models/HTTestModel.m', {}, modelGroupKey);
//
//    myProj.removeFile('Requests/HTTestRequest.h', {}, requestGroupKey);
//    myProj.removeFile('Requests/HTTestRequest.m', requestGroupKey, {});
//    myProj.addHeaderFile('Requests/HTTestRequest.h', {}, requestGroupKey);
//    myProj.addSourceFile('Requests/HTTestRequest.m', {}, requestGroupKey);
//
//
//    // Step 5: Write back to project.
//    fs.writeFileSync(projectPath, myProj.writeSync());
//    console.log('Project ' + projectPath + " is updated successfully !");
//});