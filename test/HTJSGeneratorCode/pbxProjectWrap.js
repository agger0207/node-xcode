// API is a bit wonky right now
var project = require('../../lib/pbxProject.js'),
    fs = require('fs'),
    util = require('util'),
    f = util.format,
    projectPath = 'HTJSGeneratorCode.xcodeproj/project.pbxproj',
    myProj = project(projectPath);

// Debug with parseSync as it is impossible to debug async parsing.
myProj.parseSync();

// Done. 根据uuid从Project的File Reference Section中删除某个文件.
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

// Done. 根据uuid从Project的Build File Section中删除某个文件.
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
// Note: File Reference里面的uuid和BuildPhase中的uuid不相同. 这里必须传递biuldFile 的Key而不是File Reference的Key.
function removeFromPbxSourcesBuildPhaseWithKey (buildFileKey) {
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
    while (pathList.length > 0) {
        root = pathList[0];
        groupKey = myProj.findPBXGroupKeyInParentGroup({path: root}, groupKey);
        pathList.splice(0, 1);
    }

    var group = myProj.getPBXGroupByKey(groupKey);

    return groupKey;
}