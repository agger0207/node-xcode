// API is a bit wonky right now
var project = require('../../lib/pbxProject.js'),
    fs = require('fs'),
    util = require('util'),
    f = util.format;

// TODO：参数缺少时, 需要给予警告和提示. 参数的处理需要更灵活
// node UpdateModels.js projectName groupParentPath folderParentPath
var projectName = process.argv[2];
var groupParentPath = process.argv[3];
var folderParentPath = process.argv[4];
var projectPath = projectName + '.xcodeproj/project.pbxproj';
//var projectPath = 'HTJSGeneratorCode.xcodeproj/project.pbxproj';

// Get Project.
var myProj = project(projectPath);

// Debug with parseSync as it is impossible to debug async parsing.
// For release version, it is OK to use parse function.
myProj.parseSync();

function updateCode () {
    if (undefined == projectName || undefined == groupParentPath || undefined == folderParentPath || undefined == myProj) {
        return;
    }

    // 固定添加Models和Requests, 不需要参数配置
    var autoGroupNames = ["Models", "Requests"];
    // TODO: 循环这个数组.
    var groupName = "Models";
    var absoluteGroupPath = groupParentPath + "/" + groupName;
    var groupKey = findGroupByAbsolutePath(absoluteGroupPath);
    if (undefined == groupKey) {
        // group不存在,需要创建
    } else {
        // group存在, 删除其中的所有文件.
    }


}

// 根据完整路径获取到对应的Group.
function findGroupByAbsolutePath(fullPath) {
    var pathList = fullPath.split('/');
    if (pathList.length == 0) {
        return;
    }

    var root = pathList[0];
    var groupKey =  myProj.findPBXGroupKey({ path: root});
    pathList.splice(0, 1);
    while (pathList.length > 0 && undefined != groupKey) {
        root = pathList[0];
        groupKey = myProj.findPBXGroupKeyInParentGroup({path: root}, groupKey);
        pathList.splice(0, 1);
    }

    if (undefined != groupKey) {
        console.log("Find group by absolute path  " + fullPath);
        var group = myProj.getPBXGroupByKey(groupKey);
    }

    return groupKey;
}


// removeFilesInGroup已经OK.
// Done. 根据FileRef的UUID从Project的File Reference Section中删除.
function removeFromPbxFileReferenceSectionWithKey (fileRef) {
    for (i in myProj.pbxFileReferenceSection()) {
        if (i == fileRef) {
            delete myProj.pbxFileReferenceSection()[i];
            break;
        }
    }
    var commentKey = f("%s_comment", fileRef);
    if (myProj.pbxFileReferenceSection()[commentKey] != undefined) {
        delete myProj.pbxFileReferenceSection()[commentKey];
    }
}

// TODO: 这里必须返回BuildFileUUID. 否则的话,无法从BuildPhase中删除.
function removeFromPbxBuildFileSectionWithKey (fileRef) {
    var uuid;
    var buildFileUUID;
    for (uuid in myProj.pbxBuildFileSection()) {
        var buildFile = myProj.pbxBuildFileSection()[uuid];
        if (buildFile.fileRef == fileRef) {
            delete buildFile;
            buildFileUUID = uuid;
            break;
        }
    }
    var commentKey = f("%s_comment", fileRef);
    var commentKey = f("%s_comment", fileRef);
    if (myProj.pbxBuildFileSection()[commentKey] != undefined) {
        delete myProj.pbxBuildFileSection()[commentKey];
    }

    return uuid;
}

// Note: 这里只取了firstTarget, 理论上所有的Target都需要获取. 这里所有的参数都是fileRef的uuid.
// Note: File Reference里面的uuid和BuildPhase中的uuid不相同. 所以这个方法不正确.
function removeFromPbxSourcesBuildPhaseWithKey (fileRef) {
    // var target = myProj.getFirstTarget();
    // TODO: 用FirstTarget会抛出异常,原因未知.
    var target = undefined;
    var sources = myProj.pbxSourcesBuildPhaseObj(target), i;
    for (i in sources.files) {
        if (sources.files[i].value == fileRef) {
            sources.files.splice(i, 1);
            break;
        }
    }
}

function removeFilesInGroup() {
    var groupKey = myProj.findPBXGroupKey({ path: 'Models'});
    var group = myProj.getPBXGroupByKey(groupKey);
    if (group) {
        var groupChildren = group.children, i;
        for (i in groupChildren) {
            file = groupChildren[i];
            var uuid = file.value;
            if (uuid != undefined) {
                removeFromPbxFileReferenceSectionWithKey(uuid);    // PBXFileReference
            }

            // 从当前Group中删除. TODO: 这里删除了后不可以继续遍历了.
            //groupChildren.splice(i, 1);
            // TODO: 如果是子Group, 还要继续删除. 暂时不考虑文件夹.
            //myProj.removeFromPbxGroup(file, group);            // PBXGroup

            // 从Build File Ref中删除
            var buildFileUUID = removeFromPbxBuildFileSectionWithKey(uuid);

            // 从Build Phase中删除
            if (undefined != buildFileUUID) {
                removeFromPbxSourcesBuildPhaseWithKey(buildFileUUID);
            }

            console.log("finish one file");
        }

        // 删除groupChildren.
        groupChildren.splice(0, groupChildren.length);

        //var length = groupChildren.length;
        //groupChildren = group.children;
        //length = groupChildren.length;
        //console.log(length);
    }
}



















function  test1() {
    //  var requestGroupKey = myProj.findPBXGroupKey({path: 'HTJSGeneratorCode/Request'});
    //  var requestGroupKey = myProj.findPBXGroupKey({path: 'HTJSGeneratorCode/Requests'});
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
}

function testRemoveSubGroup() {
    var requestGroupKey = myProj.findPBXGroupKeyInParent({path: 'Requests'}, {path: 'HTJSGeneratorCode'});

    if (requestGroupKey === undefined) {
        // Add new group.
        var keyByName = myProj.findPBXGroupKey({ path: 'HTJSGeneratorCode'});
        var requestGroupKey = myProj.pbxCreateGroup("Requests", "Requests");
        myProj.addToPbxGroup(requestGroupKey, keyByName, {});
        fs.writeFileSync(projectPath, myProj.writeSync());
    } else {
        // Remove group.
        console.log("requestGroupKey is found successfullye: " + requestGroupKey);
        var parentGroupKey = myProj.findPBXGroupKey({ path: 'HTJSGeneratorCode'});

        // TODO: 预期在这个方法中, 1 从Parent中删除该Group. 2 删除所有该Group下的文件 3 从Project中删除该Group.
        myProj.removeGroupFromPbxGroup(requestGroupKey, parentGroupKey);

        fs.writeFileSync(projectPath, myProj.writeSync());
    }
}

// 删除所有同名的Group.
function  testRemoveGroups() {
    //  删除 Group的时候不会删除Group下添加的文件,但是重新添加新文件的话工程会自动修正.
    myProj.removePbxGroup("11");
    fs.writeFileSync(projectPath, myProj.writeSync());
}

function  testworkflow() {
    console.log("Start update Project " + projectPath + " !");

    // Step 1: Find parent Group Key according to path. This group must be available in the project.
    // Model files and request files will be added into this group.
    // TODO: The path should be passed as a param.
    var parentGroupKey = myProj.findPBXGroupKey({ path: 'HTJSGeneratorCode'});
    console.log("parentGroupKey : " + parentGroupKey);

    // Step 2: Create group if it doesn't exist.
    // TODO: 1 Group name and path should be passed as params. 2 If the group already exists then it is uncessary to create and add them.
    var modelGroupKey = myProj.findPBXGroupKeyInParentGroup({ path: 'Models'}, parentGroupKey);
    if (undefined == modelGroupKey) {
        // Step 2: 不存在则新建Group.
        modelGroupKey = myProj.pbxCreateGroup("Models", "Models");

        // Add new created groups into parent group.
        // Step 3: 将Group加到parent Group中
        myProj.addToPbxGroup(modelGroupKey, parentGroupKey, {});
    } else {
        // Step 3: 如果存在,那么删除文件.
        // TODO: 1 File path may not work if group directory doesn't match. 2 Loop directories to find files automatically.
        // TODO: 这里不可以直接用removeFile和addFile,一定要区分header和Source.
        myProj.removeHeaderFile('HTTestModel.h', {}, modelGroupKey);
        myProj.removeSourceFile('HTTestModel.m', {}, modelGroupKey);
    }

    myProj.addHeaderFile('HTTestModel.h', {}, modelGroupKey);
    myProj.addSourceFile('HTTestModel.m', {}, modelGroupKey);


    // Step 5: Write back to project.
    fs.writeFileSync(projectPath, myProj.writeSync());
    console.log('Project ' + projectPath + " is updated successfully !");
}

// 根据完整路径获取到对应的Group.
function findGroupByAbsolutePath() {
    var fullPath = "HTJSGeneratorCode/Models";
    var pathList = fullPath.split('/');
    if (pathList.length == 0) {
        return;
    }

    var root = pathList[0];
    var groupKey =  myProj.findPBXGroupKey({ path: root});
    pathList.splice(0, 1);
    while (pathList.length > 0 && undefined != groupKey) {
        root = pathList[0];
        groupKey = myProj.findPBXGroupKeyInParentGroup({path: root}, groupKey);
        pathList.splice(0, 1);
    }

    var group = myProj.getPBXGroupByKey(groupKey);

    return groupKey;
}

//findGroupByAbsolutePath();

// 遍历文件和目录
function  loopFilesInFilePath(root) {
    var res = [];
    var files = fs.readdirSync(root);
    files.forEach(function(file) {
        var extensionFileName = GetExtensionFileName(file);
        if ("m" == extensionFileName || "h" == extensionFileName) {
            console.log(file);
        }
    });
}

function GetExtensionFileName(pathfilename)
{
    var reg = /(\\+)/g;
    var pfn = pathfilename.replace(reg, "#");
    var arrpfn = pfn.split("#");
    var fn = arrpfn[arrpfn.length - 1];
    var arrfn = fn.split(".");
    return arrfn[arrfn.length - 1];
}

//loopFilesInFilePath("HTJSGeneratorCode/Models");

// 添加文件夹到某个Group. 主要是依赖遍历文件和目录.
//function  addFolderToGroup() {
//
//}

var groupParentPath = process.argv[2];
var folderParentPath = process.argv[3];
function  testArgv() {
    console.log(groupParentPath);
    console.log(folderParentPath);
}

testArgv();





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