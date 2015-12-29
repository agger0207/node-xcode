// 这个JS直接引用xcode, 所有额外添加的东西都加在这个JS文件中.
//var xcode = require('xcode'),
var project = require('../../lib/pbxProject.js'),
    fs = require('fs'),
    util = require('util'),
    COMMENT_KEY = /_comment$/,
    f = util.format;

// TODO：参数缺少时, 需要给予警告和提示. 参数的处理需要更灵活
// node UpdateModels.js projectName groupParentPath folderParentPath
//var projectName = process.argv[2];
//var groupParentPath = process.argv[3];
//var folderParentPath = process.argv[4];
var projectName = 'HTJSGeneratorCode';
var groupParentPath = 'HTJSGeneratorCode';
var folderParentPath = 'HTJSGeneratorCode';
var projectPath = projectName + '.xcodeproj/project.pbxproj';
//var projectPath = 'HTJSGeneratorCode.xcodeproj/project.pbxproj';

// Get Project.
//var myProj = xcode.project(projectPath);
var myProj = project(projectPath);

// Debug with parseSync as it is impossible to debug async parsing.
// For release version, it is OK to use parse function.
myProj.parseSync();
//updateCode();
addResources();

//
//function updateCode () {
//    if (undefined == projectName || undefined == groupParentPath || undefined == folderParentPath || undefined == myProj) {
//        console.log("Please correct parameters, the command is like \r\n node UpdateModels.js projectName groupParentPath folderParentPath, please specify your own projectName, parent group path and pareng folder path");
//        return;
//    }
//
//    // TODO: 现在暂时不支持更换路径,即之前要删除的路径和后面要添加的路径不相同的Case.
//    console.log("Begin to update project " + projectName + ", Models and Requests will be added under group " + groupParentPath);
//
//    // 固定添加Models和Requests, 不需要参数配置
//    var autoGroupNames = ["Models", "Requests"];
//    autoGroupNames.forEach(function (groupName){
//        console.log("Begin to check folder " + groupName);
//
//        // 获取parent Group Key 和 要处理的Group Key
//        var absoluteGroupPath = groupParentPath + "/" + groupName;
//        var parentGroupKey = findGroupByAbsolutePath(groupParentPath);
//        var groupKey = findGroupByAbsolutePath(absoluteGroupPath);
//        if (undefined == groupKey) {
//            // group不存在, 新建Group. GroupName与Path相同.
//            console.log("Group " + groupName + " does not exist, create group " + groupName + " under group " + groupParentPath);
//            groupKey = myProj.pbxCreateGroup(groupName, groupName);
//
//            // Add new created groups into parent group.
//            // 将Group加到parent Group中
//            myProj.addToPbxGroup(groupKey, parentGroupKey, {});
//        } else {
//            // group存在, 删除其中的所有文件.
//            console.log("Group " + groupName + " already exists, remove all files in this group first.");
//            removeFilesInGroup(groupName);
//        }
//
//        // 获取目录下的所有头文件和可执行文件
//        var folderPath = folderParentPath + "/" + groupName;
//        var headerFiles = headerFilesInFilePath(folderPath);
//        var sourceFiles = sourceFilesInFilePath(folderPath);
//
//        // 将头文件添加到group中.
//        headerFiles.forEach(function(headerFile) {
//            myProj.addHeaderFile(headerFile, {}, groupKey);
//        });
//
//        // 将源文件添加到group中
//        sourceFiles.forEach(function(sourceFile) {
//            myProj.addSourceFile(sourceFile, {}, groupKey);
//        });
//
//        console.log("Add Source Files and Header Files from Path " + folderPath + " to group " + absoluteGroupPath + " successfully");
//    });
//
//
//    // 将内容写回到工程文件中.
//    fs.writeFileSync(projectPath, myProj.writeSync());
//    console.log('Project ' + projectPath + " is updated successfully !");
//}

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
        groupKey = findPBXGroupKeyInParentGroup({path: root}, groupKey);
        pathList.splice(0, 1);
    }

    // TODO: 下面的代码只用校验是否能够取到正确的Group.
    if (undefined != groupKey) {
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
            // TODO: delete buildFile没有从这个字典中真正删除这个文件.
            //delete buildFile;
            delete myProj.pbxBuildFileSection()[uuid];
            buildFileUUID = uuid;
            break;
        }
    }

    var commentKey = f("%s_comment", fileRef);
    if (myProj.pbxBuildFileSection()[commentKey] != undefined) {
        delete myProj.pbxBuildFileSection()[commentKey];
    }

    return buildFileUUID;
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











// Projects Extension
// 这些最好添加到pbxProject.js中, 仅供当前流程使用.
function removePbxGroupByKey(groupKey) {
    var section = myProj.hash.project.objects['PBXGroup'],
        key, itemKey;

    for (key in section) {
        // only look for comments
        if (!COMMENT_KEY.test(key)) continue;

        if (key == groupKey) {
            itemKey = key.split(COMMENT_KEY)[0];
            delete section[itemKey];
        }
    }
}

function removeGroupFromPbxGroup(removeGroupKey, groupKey) {
    var group = myProj.getPBXGroupByKey(groupKey);
    var removeGroup = myProj.getPBXGroupByKey(removeGroupKey);
    if (group) {
        var groupChildren = group.children, i;
        for(i in groupChildren) {
            if(removeGroupKey == groupChildren[i].value && removeGroup != undefined) {
                groupChildren.splice(i, 1);

                clearGroup(removeGroup);
                break;
            }
        }
    }

    delete removeGroup;
}

function clearGroup(group) {
    var groupChildren = group.children, i;
    for (i in groupChildren) {
        file = groupChildren[i];
        if (file.fileRef != undefined) {
            myProj.removeFromPbxFileReferenceSection(file);    // PBXFileReference
        }

        // TODO: 如果是子Group, 还要继续删除.
        myProj.removeFromPbxGroup(file, group);            // PBXGroup
    }
}

function removeGroupByKey(key, parentGroupKey) {
    var group = getPBXGroupByKey(key, parentGroupKey);
    if (group) {
        var groupChildren = group.children, i;
        for (i in groupChildren) {
            file = groupChildren[i];
            if (file.fileRef != undefined) {
                myProj.removeFromPbxFileReferenceSection(file);    // PBXFileReference
            }

            // TODO: 如果是子Group, 还要继续删除.
            myProj.removeFromPbxGroup(file, group);            // PBXGroup
        }
    }
}

// Remove a group and all files in this group.
function removeGroup(groupPath, parentGroupKey) {
    var group = getPBXGroupByPath(groupPath, parentGroupKey);
    if (group) {
        var groupChildren = group.children, i;
        for (i in groupChildren) {
            file = groupChildren[i];
            if (file.fileRef != undefined) {
                myProj.removeFromPbxFileReferenceSection(file);    // PBXFileReference
            }

            // TODO: 如果是子Group, 还要继续删除.
            myProj.removeFromPbxGroup(file, group);            // PBXGroup
        }
    }
}


function getPBXGroupByPath(path, parentGroupKey) {
    var groups = (undefined == parentGroupKey) ? myProj.hash.project.objects['PBXGroup'] : myProj.getPBXGroupByKey(parentGroupKey);
    for (var key in groups) {
        var group = groups[key];
        if (group.path === path) {
            return group;
        }
    }

    return undefined;
};

function getPBXGroupByKey(key, parentGroupKey) {
    var groups = (undefined == parentGroupKey) ? myProj.hash.project.objects['PBXGroup'] : myProj.getPBXGroupByKey(parentGroupKey);
    var group = groups[key];
    return group;
};

function findPBXGroupInParent(criteria, parentCriteria) {
    if (undefined == parentCriteria) {
        return myProj.findPBXGroupKey(criteria);
    }

    var target;
    var groupKey = myProj.findPBXGroupKey(parentCriteria);
    var group = myProj.getPBXGroupByKey(groupKey);
    var groupChildren = group.children, i;
    for(i in groupChildren) {
        var child = groupChildren[i];
        var childGroup = myProj.getPBXGroupByKey(child.value);
        if (undefined == childGroup) {
            // 这不是一个对应的Group.
            continue;
        }

        if (criteria && criteria.path && criteria.name) {
            if (criteria.path === childGroup.path && criteria.name === childGroup.name) {
                target = childGroup;
                break
            }
        }
        else if (criteria && criteria.path) {
            if (criteria.path === childGroup.path) {
                target = childGroup;
                break
            }
        }
        else if (criteria && criteria.name) {
            if (criteria.name === childGroup.name) {
                target = childGroup;
                break
            }
        }
    }

    return target;
}

function  findPBXGroupKeyInParent(criteria, parentCriteria) {
    if (undefined == parentCriteria) {
        return myProj.findPBXGroupKey(criteria);
    }

    var target;
    var groupKey = myProj.findPBXGroupKey(parentCriteria);
    var group = myProj.getPBXGroupByKey(groupKey);
    var groupChildren = group.children, i;
    for(i in groupChildren) {
        var child = groupChildren[i];
        var childGroup = myProj.getPBXGroupByKey(child.value);
        if (undefined == childGroup) {
            // 这不是一个对应的Group.
            continue;
        }

        if (criteria && criteria.path && criteria.name) {
            if (criteria.path === childGroup.path && criteria.name === childGroup.name) {
                target = child.value;
                break
            }
        }
        else if (criteria && criteria.path) {
            if (criteria.path === childGroup.path) {
                target = child.value;
                break
            }
        }
        else if (criteria && criteria.name) {
            if (criteria.name === childGroup.name) {
                target = child.value;
                break
            }
        }
    }

    return target;
}


function findPBXGroupKeyInParentGroup(criteria, parentGroupKey) {
    var target;
    var group = getPBXGroupByKey(parentGroupKey);
    var groupChildren = group.children, i;
    for(i in groupChildren) {
        var child = groupChildren[i];
        var childGroup = myProj.getPBXGroupByKey(child.value);
        if (undefined == childGroup) {
            // 这不是一个对应的Group.
            continue;
        }

        if (criteria && criteria.path && criteria.name) {
            if (criteria.path === childGroup.path && criteria.name === childGroup.name) {
                target = child.value;
                break
            }
        }
        else if (criteria && criteria.path) {
            if (criteria.path === childGroup.path) {
                target = child.value;
                break
            }
        }
        else if (criteria && criteria.name) {
            if (criteria.name === childGroup.name) {
                target = child.value;
                break
            }
        }
    }

    return target;
}




function addResources () {
    if (undefined == projectName || undefined == groupParentPath || undefined == folderParentPath || undefined == myProj) {
        console.log("Please correct parameters, the command is like \r\n node UpdateModels.js projectName groupParentPath folderParentPath, please specify your own projectName, parent group path and pareng folder path");
        return;
    }

    var parentGroupKey = findGroupByAbsolutePath(groupParentPath);
    if (undefined == parentGroupKey) {
        console.log("Could not find group to add resource file");
    }

    //addXcassets("Assets.xcassets", parentGroupKey);
    addPlistFile("Info.plist", parentGroupKey, {});

    // 将内容写回到工程文件中.
    fs.writeFileSync(projectPath, myProj.writeSync());
    console.log('Project ' + projectPath + " is updated with Info.plist successfully !");
}



function addXibFile(path, opt) {
    myProj.addResourceFile(path, opt);
}

function addStoryboardFile(path, opt) {
    myProj.addResourceFile(path, opt);
}

function addPlistFile(path, group, opt) {
    myProj.addFile(path, group, opt);
}

function addXcassets(path, group, opt) {
    myProj.addResourceFile(path, opt);
}

//
//pbxProject.prototype.addResourceFile = function(path, opt) {
//    opt = opt || {};
//
//    var file;
//
//    if (opt.plugin) {
//        file = this.addPluginFile(path, opt);
//        if (!file) return false;
//    } else {
//        file = new pbxFile(path, opt);
//        if (this.hasFile(file.path)) return false;
//    }
//
//    file.uuid = this.generateUuid();
//    file.target = opt ? opt.target : undefined;
//
//    if (!opt.plugin) {
//        correctForResourcesPath(file, this);
//        file.fileRef = this.generateUuid();
//    }
//
//    this.addToPbxBuildFileSection(file);        // PBXBuildFile
//    this.addToPbxResourcesBuildPhase(file);     // PBXResourcesBuildPhase
//
//    if (!opt.plugin) {
//        this.addToPbxFileReferenceSection(file);    // PBXFileReference
//        this.addToResourcesPbxGroup(file);          // PBXGroup
//    }
//
//    return file;
//}
