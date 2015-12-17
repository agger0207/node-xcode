// API is a bit wonky right now
var project = require('../../lib/pbxProject.js'),
    fs = require('fs'),
    util = require('util'),
    f = util.format,
    projectPath = 'HTJSGeneratorCode.xcodeproj/project.pbxproj',
    myProj = project(projectPath);

// Debug with parseSync as it is impossible to debug async parsing.
myProj.parseSync();

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
