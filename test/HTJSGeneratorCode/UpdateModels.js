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
updateCode();

function updateCode () {
    if (undefined == projectName || undefined == groupParentPath || undefined == folderParentPath || undefined == myProj) {
        return;
    }

    // 固定添加Models和Requests, 不需要参数配置
    var autoGroupNames = ["Models", "Requests"];
    autoGroupNames.forEach(function (groupName){
        // 获取parent Group Key 和 要处理的Group Key
        var absoluteGroupPath = groupParentPath + "/" + groupName;
        var parentGroupKey = findGroupByAbsolutePath(groupParentPath);
        var groupKey = findGroupByAbsolutePath(absoluteGroupPath);
        if (undefined == groupKey) {
            // group不存在, 新建Group. GroupName与Path相同.
            groupKey = myProj.pbxCreateGroup(groupName, groupName);

            // Add new created groups into parent group.
            // 将Group加到parent Group中
            myProj.addToPbxGroup(groupKey, parentGroupKey, {});
        } else {
            // group存在, 删除其中的所有文件.
            removeFilesInGroup(groupName);
        }

        // 获取目录下的所有头文件和可执行文件
        var folderPath = folderParentPath + "/" + groupName;
        var headerFiles = headerFilesInFilePath(folderPath);
        var sourceFiles = sourceFilesInFilePath(folderPath);

        // 将头文件添加到group中.
        headerFiles.forEach(function(headerFile) {
            myProj.addHeaderFile(headerFile, {}, groupKey);
        });

        // 将源文件添加到group中
        sourceFiles.forEach(function(sourceFile) {
            myProj.addSourceFile(sourceFile, {}, groupKey);
        });
    });


    // 将内容写回到工程文件中.
    fs.writeFileSync(projectPath, myProj.writeSync());
    console.log('Project ' + projectPath + " is updated successfully !");
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

function removeFilesInGroup(groupName) {
    var groupKey = myProj.findPBXGroupKey({ path: groupName});
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
    }
}

// 找到所有的头文件.
function headerFilesInFilePath(root) {
    var res = [];
    var files = fs.readdirSync(root);
    files.forEach(function(file) {
        var extensionFileName = GetExtensionFileName(file);
        if ("h" == extensionFileName) {
            res.push(file);
        }
    });

    return res;
}

// 找到所有的源文件
// TODO: 性能可以改进, 可以一次性找出头文件和源文件,不需要每次都遍历一遍.
function sourceFilesInFilePath(root) {
    var res = [];
    var files = fs.readdirSync(root);
    files.forEach(function(file) {
        var extensionFileName = GetExtensionFileName(file);
        if ("m" == extensionFileName) {
            res.push(file);
        }
    });

    return res;
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