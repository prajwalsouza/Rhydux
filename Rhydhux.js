const Rhydux = (function() {


    let default_config= {
        tagSeparator: "--slashRhydux-",
        maxTagNameLength: 1000,
    }

    function generateRandomString(prefix="") {
        return prefix + Math.random().toString(36).substring(2, 15) + "-" + Math.random().toString(36).substring(2, 15); // can contain only letters and numbers
    }


    function lerpFunction(value, inputMin=0, inputMaz=1, outputMin=0, outputMax=1) {
        return outputMin + (outputMax - outputMin) * (value - inputMin) / (inputMaz - inputMin);
    }

    function TagTree() {
        // two basics tree paths : systemTags and regularTags 
        this.systemTags = {}
        this.regularTags = {}

        // tag tree specifications:
        // all tags are separated with --slashRhydux- when representing a nested tag
    }

    const moveChildrenTagsToParent = (parentTag, newParentTag, childrenTags, tagType) => {
        for (const childTag in childrenTags) {
            oldPath = childTag.fullTagPath
            childTag.fullTagPath = newParentTag.fullTagPath + default_config.tagSeparator + childTag.tagName;
            // updated the key of the child tag itself
            this.tagTree[tagType][childTag.fullTagPath] = childTag;
            delete this.tagTree[tagType][oldPath];

            // got to each object and update the tag path
            for (const objectID in childTag.objects) {
                this.objects[objectID].tags[childTag.fullTagPath] = childTag;
                // delete the old tag path
                delete this.objects[objectID].tags[oldPath];
            }
        }
    }

    // Rhydux object

    let RhyduxData = {}

    function RhyduxDB(options) {
        // id is generated randomly as a alphanumeric string of with time
        const randomString = generateRandomString(); // can contain only letters and numbers
        this.id = options && options.id ? options.id : "rhyduxDB--" + randomString + "--" + Date.now().toString(36);
        this.options = options;
        this.tagTree = new TagTree();
        this.objects = {}

        this.operations = {
            getMainTagType: (tagPath) => {
                var tag = this.tagTree.systemTags[tagPath];
                if (tag) {
                    return "systemTag";
                }
                tag = this.tagTree.regularTags[tagPath];
                if (tag) {
                    return "regularTag";
                }
                return null;
            },
            createSystemTag: (tagName="System Tag", parentTagPath=null, userCanAssign=true, additionalProperties={}) => {

                var shortNameTrimmed = ""
                if (tagName) {
                    shortNameTrimmed = tagName.split(" ").map(word => word.trim()).join("").toLowerCase();
                }

                // tag name cannot have the forbidden words [regularTag, systemTag, separator variables]
                if (shortNameTrimmed.includes("regulartag") || shortNameTrimmed.includes("systemtag")) {
                    throw new Error("Tag name cannot have the forbidden words [regularTag, systemTag]");
                }

                // tag name cannot have default_config.tagSeparator
                if (shortNameTrimmed.includes(default_config.tagSeparator)) {
                    throw new Error("Tag name cannot have the separator for this database:  " + default_config.tagSeparator);
                }

                // tag name cannot be longer than default_config.maxTagNameLength
                if (tagName.length > default_config.maxTagNameLength) {
                    throw new Error("Tag name cannot be longer than " + default_config.maxTagNameLength + " characters");
                }

                

                if (parentTagPath) {
                    const parentTag = this.tagTree.systemTags[parentTagPath];
                    if (!parentTag) {
                        throw new Error("Parent tag not found, OR is not a system tag");
                    }
                }

                const randomString = generateRandomString(); // can contain only letters and numbers
                const systemTagID = "systemTag--" + shortNameTrimmed + "---" + randomString + "--" + Date.now().toString(36);
                
                
                const fullTagPath = (parentTagPath ? parentTagPath + default_config.tagSeparator : "") + systemTagID;
                const createdTime = Date.now();
                const objects = {}
                const systemTag = {
                    ...additionalProperties,
                    tagName,
                    id: systemTagID,
                    fullTagPath,
                    createdTime,
                    lastModifiedTime: createdTime,
                    colorHue: "none",
                    objects,
                    expanded: false,
                    userCanAssign,
                    visibleInNavigation: true,
                    editable: false,
                    fontAwesomeIcon: "tag"
                };

                this.tagTree.systemTags[fullTagPath] = systemTag;
                return systemTag;
            },
            createRegularTag: (tagName="Regular Tag", parentTagPath=null, additionalProperties={}) => {
                var shortNameTrimmed = ""
                if (tagName) {
                    shortNameTrimmed = tagName.split(" ").map(word => word.trim()).join("").toLowerCase();
                }

                if (parentTagPath) {
                    const parentTag = this.tagTree.regularTags[parentTagPath];
                    if (!parentTag) {
                        throw new Error("Parent tag not found, OR is not a regular tag");
                    }
                }

                const randomString = generateRandomString(); // can contain only letters and numbers
                const regularTagID = "regularTag--" + shortNameTrimmed + "---" + randomString + "--" + Date.now().toString(36);
                const fullTagPath = (parentTagPath ? parentTagPath + default_config.tagSeparator : "") + regularTagID;
                const createdTime = Date.now();
                const objects = {}
                const regularTag = {
                    ...additionalProperties,
                    tagName,
                    id: regularTagID,
                    fullTagPath,
                    createdTime,
                    lastModifiedTime: createdTime,
                    colorHue: "none",
                    objects,
                    expanded: false,
                    editable: true,
                    visibleInNavigation: true,
                    fontAwesomeIcon: "tag"
                };

                this.tagTree.regularTags[fullTagPath] = regularTag;
                return regularTag;
            },
            getSystemTag: (tagName) => {
                return this.tagTree.systemTags[tagName];
            },
            getRegularTag: (tagName) => {
                return this.tagTree.regularTags[tagName];
            },
            getTag: (tagPath) => {
                if (!tagPath) {
                    return null;
                }
                var tagType = this.operations.getMainTagType(tagPath);
                var tagType = tagType + "s"
                return this.tagTree[tagType][tagPath];
            },
            
            deleteTag: (tagPath) => {
                // check if the tag is a system tag or a regular tag
                var tagType = this.operations.getMainTagType(tagPath);
                if (!tagType) {
                    throw new Error("Tag not found");
                }

                var tagType = tagType + "s"

                for (const childTag in this.tagTree[tagType]) {
                    if (childTag.startsWith(tagPath)) {
                        // remove the tag from the objects
                        for (const objectID in this.objects) {
                            delete this.objects[objectID].tags[childTag];
                        }
                        
                        delete this.tagTree[tagType][childTag];
                    }
                }



                delete this.tagTree[tagType][tagPath];
           

                return;

            },
            setExpanded: (tagPath, expanded) => {
                // get type
                var tagType = this.operations.getMainTagType(tagPath);
                var tagType = tagType + "s"
                this.tagTree[tagType][tagPath].expanded = expanded;
            },

            editTagName: (tagPath, newTagName="") => {
                var tagType = this.operations.getMainTagType(tagPath);
                var tagType = tagType + "s"
                this.tagTree[tagType][tagPath].tagName = newTagName;
            },

            editTagProp: (tagPath, propName, propValue) => {
                var tagType = this.operations.getMainTagType(tagPath);
                var tagType = tagType + "s"
                this.tagTree[tagType][tagPath][propName] = propValue;
            },


            createObject: (objectName="Object", props={}) => {
                const randomString = generateRandomString(); // can contain only letters and numbers
                const objectID = "object--" + objectName + "---" + randomString + "--" + Date.now().toString(36);
                const createdTime = Date.now();
                const objectTags = {}
                const object = {
                    props,
                    objectName,
                    id: objectID,
                    createdTime,
                    lastModifiedTime: createdTime,
                    movedToTrashTime: null,
                    tags: objectTags,
                };

                this.objects[objectID] = object;
                return object;
            },

            changeObject: (objectID, newProps) => {
                this.objects[objectID].props = newProps;
                this.objects[objectID].lastModifiedTime = Date.now();
            },

            changeObjectProp: (objectID, propName, propValue) => {
                this.objects[objectID].props[propName] = propValue;
                this.objects[objectID].lastModifiedTime = Date.now();
            },

            deleteObject: (objectID) => {
                // handle the tags first
                for (const tagPath in this.objects[objectID].tags) {
                    delete this.tagTree[this.operations.getMainTagType(tagPath) + "s"][tagPath].objects[objectID];
                }
                
                delete this.objects[objectID];
                
            },

            moveToTrash: (objectID) => {
                // add trash tag if available
                if (this.trashTag) {

                    // handle the other tags first
                    // for (const tagPath in this.objects[objectID].tags) {
                    //     delete this.tagTree[this.operations.getMainTagType(tagPath) + "s"][tagPath].objects[objectID];
                    // }

                    // set object moved to trash time
                    this.objects[objectID].movedToTrashTime = Date.now();


                    this.operations.addTagToObject(objectID, this.trashTag);
                }
            },

            getObject: (objectID) => {
                return this.objects[objectID];
            },

            addTagToObject: (objectID, tagPath) => {
                const object = this.objects[objectID];
                const tagType = this.operations.getMainTagType(tagPath);
                if (tagType === "systemTag") {
                    object.tags[tagPath] = this.tagTree.systemTags[tagPath];

                    // add the object id
                    this.tagTree.systemTags[tagPath].objects[objectID] = {objectID, objectName: object.objectName};
                } else if (tagType === "regularTag") {
                    object.tags[tagPath] = this.tagTree.regularTags[tagPath];

                    // add the object id
                    this.tagTree.regularTags[tagPath].objects[objectID] = {objectID, objectName: object.objectName};
                }

                return object;
            },

            removeTagFromObject: (objectID, tagPath) => {

                const tagType = this.operations.getMainTagType(tagPath) + "s"
                const object = this.objects[objectID];

                delete object.tags[tagPath];

                // remove the object id
                delete this.tagTree[tagType][tagPath].objects[objectID];
            },

            getObjectTags: (objectID) => {
                const object = this.objects[objectID];
                return object.tags;
            },

            getObjects: (tagPath) => { 
                returningObjects = {}



                if (tagPath == null) {
                    // return all objects
                    for (const objectID in this.objects) {
                        // check if has the trash tag
                        if (this.trashTag && this.objects[objectID].tags[this.trashTag] && this.trashTag !== tagPath) {
                            continue;
                        }
                        returningObjects[objectID] = {
                            path: null,
                            object: this.objects[objectID],
                        }
                    }

                    return returningObjects;
                }

                // get main tag type
                var tagType = this.operations.getMainTagType(tagPath);
                var tagType = tagType + "s"

                // get all paths that start with the tagPath
                var paths = Object.keys(this.tagTree[tagType]).filter(path => path.startsWith(tagPath));


                for (const path of paths) {
                    objectsFound = this.tagTree[tagType][path].objects;

                    for (const objectID in objectsFound) {

                        // check if has the trash tag
                        if (this.trashTag && this.objects[objectID].tags[this.trashTag] && this.trashTag !== tagPath) {
                            continue;
                        }
                        returningObjects[objectID] = {
                            path: path,
                            object: objectsFound[objectID],
                        }
                    }
                }

                // this.tagTree[tagType][tagPath].objects

                return returningObjects;
            },

            getObjectsPaginated: (tagPath, perPage = 20, pageNumber = 0) => {
                returningObjects = {}

                // get main tag type
                var tagType = this.operations.getMainTagType(tagPath);
                var tagType = tagType + "s"

                // get all paths that start with the tagPath
                var paths = Object.keys(this.tagTree[tagType]).filter(path => path.startsWith(tagPath));

                for (const path of paths) {
                    objectsFound = this.tagTree[tagType][path].objects;

                    for (const objectID in objectsFound) {
                        returningObjects[objectID] = {
                            path: path,
                            object: objectsFound[objectID],
                        }
                    }
                }

                // get only those on the page
                var objectKeys = Object.keys(returningObjects);
                var paginatedObjects = {}
                for (let i = pageNumber * perPage; i < (pageNumber + 1) * perPage; i++) {
                    if (objectKeys[i]) {
                        paginatedObjects[objectKeys[i]] = returningObjects[objectKeys[i]];
                    }
                }

                return paginatedObjects;

            
            },

            sortObjects: (objectsInvolved, type="descending") => {
                var sortedObjects = {}

                // sort by lastModifiedTime
                var sortable = [];

                for (const objectID in objectsInvolved) {
                    sortable.push([objectID, objectsInvolved[objectID].object.lastModifiedTime]);
                }

                if (type === "ascending") {
                    sortable.sort(function(a, b) {
                        return a[1] - b[1];
                    });
                } else {
                    sortable.sort(function(a, b) {
                        return b[1] - a[1];
                    });
                }

                for (const object of sortable) {
                    sortedObjects[object[0]] = objectsInvolved[object[0]];
                }

                return sortedObjects;
            },

            getChildrenTags: (tagPath) => {
                var tagType = this.operations.getMainTagType(tagPath);
                var tagType = tagType + "s"

                var childrenTags = {}
                for (const childTag in this.tagTree[tagType]) {
                    if (childTag.startsWith(tagPath) && childTag !== tagPath) {
                        childrenTags[childTag] = this.tagTree[tagType][childTag];
                    }
                }

                return childrenTags;
            },

            getImmediateChildrenTags: (tagPath) => {
                var tagType = this.operations.getMainTagType(tagPath);
                var tagType = tagType + "s"

                var childrenTags = {}
                for (const childTag in this.tagTree[tagType]) {
                    var childTagLevel = childTag.split(default_config.tagSeparator).length
                    var tagLevel = tagPath.split(default_config.tagSeparator).length
                    if (childTag.startsWith(tagPath) && childTag !== tagPath && childTagLevel == tagLevel + 1) {
                        childrenTags[childTag] = this.tagTree[tagType][childTag];
                    }
                }

                return childrenTags;
            },

            getImmediateParentTag: (tagPath) => {
                var tagType = this.operations.getMainTagType(tagPath); 
                var tagType = tagType + "s"

                var tagLevel = tagPath.split(default_config.tagSeparator).length
                var parentTagPath = tagPath.split(default_config.tagSeparator).slice(0, tagLevel - 1).join(default_config.tagSeparator);

                if (parentTagPath) {
                    return parentTagPath;
                }

                return null;
            },

            getHighestLevelTags: () => {
                var highestLevelTags = []

                for (const tagPath in this.tagTree.systemTags) {
                    if (tagPath.split(default_config.tagSeparator).length == 1) {
                        highestLevelTags.push(tagPath)
                    }
                }

                for (const tagPath in this.tagTree.regularTags) {
                    if (tagPath.split(default_config.tagSeparator).length == 1) {
                        highestLevelTags.push(tagPath)
                    }
                }


                return highestLevelTags;
            },


            moveTag: (tagPath, newParentTagPath) => {
                // check if the tag is a system tag or a regular tag
                var tagType = "systemTags"
                if (this.tagTree.systemTags[tagPath]) {
                    tagType = "systemTags"
                } else if (this.tagTree.regularTags[tagPath]) {
                    tagType = "regularTags"
                }

                // check if the new parent tag is a system tag or a regular tag
                var newParentTagType = "systemTags"
                if (this.tagTree.systemTags[newParentTagPath]) {
                    newParentTagType = "systemTags"
                } else if (this.tagTree.regularTags[newParentTagPath]) {
                    newParentTagType = "regularTags"
                }

                // tags must be of the same type
                if (tagType !== newParentTagType) {
                    throw new Error("Tags must be of the same type");
                }

                // you cannot move a tag under itself
                if (tagPath === newParentTagPath) {
                    throw new Error("You cannot move a tag under itself");
                }

                // or move parent under child
                // console.log("movingTagPath", tagPath)
                // console.log("newParentTag : ", newParentTagPath)
                if (newParentTagPath.startsWith(tagPath)) {
                    console.log("You cannot move a parent tag under its child")
                    throw new Error("You cannot move a parent tag under its child");
                }

                var tagLevel = tagPath.split(default_config.tagSeparator).length
                var newParentTagLevel = newParentTagPath.split(default_config.tagSeparator).length

                // console.log(tagLevel, newParentTagLevel)

                if (tagPath.startsWith(newParentTagPath + default_config.tagSeparator) && tagLevel == newParentTagLevel + 1) {
                    console.log("You cannot move a tag under its immediate parent")
                    throw new Error("You cannot move a tag under its immediate parent");
                }


                // adjust all paths of tags according to the move
                var tag = this.tagTree[tagType][tagPath];
                var parentTag = this.tagTree[tagType][newParentTagPath];

                // console.log(tag)
                // console.log(parentTag)

                const oldPath = tag.fullTagPath;
                const newPath = parentTag.fullTagPath + default_config.tagSeparator + tag.id;

                // replace all oldPath with newPath in all tags and objects
                for (const tag in this.tagTree[tagType]) {
                    if (tag.startsWith(oldPath)) {
                        // new path here 
                        subPath = tag.split(oldPath)[1];
                        tagNewPath = newPath + subPath;
                        this.tagTree[tagType][tagNewPath] = this.tagTree[tagType][tag];
                        this.tagTree[tagType][tagNewPath].fullTagPath = tagNewPath;

                        for (const objectID in this.objects) {
                            const object = this.objects[objectID];
                            if (object.tags[tag]) {
                                object.tags[tagNewPath] = object.tags[tag];
                                object.tags[tagNewPath].fullTagPath = tagNewPath;
                                delete object.tags[tag];
                            }
                        }

                        // delete the old path
                        delete this.tagTree[tagType][tag];
                    }
                }



                // tag.fullTagPath = newPath;
            },

            getAncestryString: (tagPath) => {
                var tagType = this.operations.getMainTagType(tagPath);

                var tagType = tagType + "s"

                var tagPathParts = tagPath.split(default_config.tagSeparator);

                var ancestryPaths = []

                if (tagPathParts.length == 1) {
                    return "";
                }
                
                for (let i = 0; i < tagPathParts.length - 1; i++) {
                    var path = tagPathParts.slice(0, i + 1).join(default_config.tagSeparator);
                    ancestryPaths.push(path);
                }

                var ancestryString = ""
                for (const path of ancestryPaths) {
                    if (this.tagTree[tagType][path]) {
                        ancestryString += this.tagTree[tagType][path].tagName + "/";
                    }
                }

            
                return ancestryString;
            },

            searchForObject: (searchQuery, searchProps=[], maxResults=100) => {
                // search for object in the database
                var searchResults = []
                for (const objectID in this.objects) {
                    const object = this.objects[objectID];

                    if (object.objectName.includes(searchQuery)) {
                        searchResults.push(object);
                        if (searchResults.length >= maxResults) {
                            return searchResults;
                        }
                        break;
                    }

                    for (const searchProp of searchProps) {
                        if (object.props[searchProp] && typeof object.props[searchProp] === "string") {
                            if (object.props[searchProp].includes(searchQuery)) {
                                searchResults.push(object);
                                if (searchResults.length >= maxResults) {
                                    return searchResults;
                                }
                                break;
                            }
                        }
                    }
                }

                return searchResults;
            },

            searchForTag: (searchQuery, searchProps=[], maxResults=100) => {
                // search for tag in the database
                var searchQuery = searchQuery.toLowerCase();
                var searchResults = []

                for (const tagPath in this.tagTree.regularTags) {
                    const tag = this.tagTree.regularTags[tagPath];

                    if (tag.tagName.toLowerCase().includes(searchQuery)) {
                        searchResults.push(tag);
                        if (searchResults.length >= maxResults) {
                            return searchResults;
                        }
                    }

                    for (const searchProp of searchProps) {
                        if (tag[searchProp] && typeof tag[searchProp] === "string") {
                            if (tag[searchProp].toLowerCase().includes(searchQuery)) {
                                searchResults.push(tag);
                                if (searchResults.length >= maxResults) {
                                    return searchResults;
                                }
                                break;
                            }
                        }
                    }
                }

                for (const tagPath in this.tagTree.systemTags) {
                    const tag = this.tagTree.systemTags[tagPath];

                    if (tag.tagName.toLowerCase().includes(searchQuery)) {
                        searchResults.push(tag);
                        if (searchResults.length >= maxResults) {
                            return searchResults;
                        }
                    }

                    for (const searchProp of searchProps) {
                        if (tag[searchProp] && typeof tag[searchProp] === "string") {
                            if (tag[searchProp].toLowerCase().includes(searchQuery)) {
                                searchResults.push(tag);
                                if (searchResults.length >= maxResults) {
                                    return searchResults;
                                }
                                break;
                            }
                        }
                    }
                }

                return searchResults;
            },


            searchForTagForObject: (searchQuery, objectKey, searchProps=[], maxResults=100) => {
                // search for tag in the database
                var searchQuery = searchQuery.toLowerCase();
                var searchResults = []

                // get object and its tags

                const object = this.objects[objectKey];
                const objectTags = object.tags;
                

                for (const tagPath in this.tagTree.regularTags) {

                    if (objectTags[tagPath]) {
                        continue
                    }

                    const tag = this.tagTree.regularTags[tagPath];

                    if (tag.tagName.toLowerCase().includes(searchQuery)) {
                        searchResults.push(tag);
                        if (searchResults.length >= maxResults) {
                            return searchResults;
                        }
                    }

                    for (const searchProp of searchProps) {
                        if (tag[searchProp] && typeof tag[searchProp] === "string") {
                            if (tag[searchProp].toLowerCase().includes(searchQuery)) {
                                searchResults.push(tag);
                                if (searchResults.length >= maxResults) {
                                    return searchResults;
                                }
                                break;
                            }
                        }
                    }
                }

                for (const tagPath in this.tagTree.systemTags) {
                    const tag = this.tagTree.systemTags[tagPath];

                    if (objectTags[tagPath]) {
                        continue
                    }

                    if (tag.tagName.toLowerCase().includes(searchQuery)) {
                        if (tag.userCanAssign == true) {
                            searchResults.push(tag);
                        }
                        if (searchResults.length >= maxResults) {
                            return searchResults;
                        }
                    }

                    for (const searchProp of searchProps) {
                        if (tag[searchProp] && typeof tag[searchProp] === "string") {
                            if (tag[searchProp].toLowerCase().includes(searchQuery)) {
                                if (tag.userCanAssign == true) {
                                    searchResults.push(tag);
                                }
                                if (searchResults.length >= maxResults) {
                                    return searchResults;
                                }
                                break;
                            }
                        }
                    }
                }

                return searchResults;
            },

            isInTrash: (objectID) => {
                if (this.trashTag && this.objects[objectID].tags[this.trashTag]) {
                    return true;
                }

                return false;
            },

            emptyTrash: () => {
                if (this.trashTag) {
                    for (const objectID in this.objects) {
                        if (this.objects[objectID].tags[this.trashTag]) {
                            var deletedTime = this.objects[objectID].movedToTrashTime;
                            var toBeDeleted = Date.now() - deletedTime >  this.options.trashRemovalTime;

                            if (toBeDeleted) {
                                this.operations.deleteObject(objectID);
                            }
                        }
                    }
                }
            },


        },

        this.trashTag = null;

        this.renderedTree = null;

        this.renderTagTree = () => {
            // generate a tree view of the tag tree, get every tag in a list, add to tree structure and remove the tag from the list

            const renderingTreeSystemTags = {
                "name": "System TagsTree Root",
                TAG_DATA: {
                    expanded: true,
                    visibleInNavigation: true,
                },
                "children": {}
            }

            const renderingTreeRegularTags = {
                "name": "Regular TagsTree Root",
                TAG_DATA: {
                    expanded: true,
                    visibleInNavigation: true,
                },
                "children": {}
            }

            const tagListSystemTags = Object.values(this.tagTree.systemTags);
            const tagListRegularTags = Object.values(this.tagTree.regularTags);
            
            for (const tag of tagListSystemTags) {
                const tagPath = tag.fullTagPath.split(default_config.tagSeparator);
                let currentLevel = renderingTreeSystemTags;

                for (let i = 0; i < tagPath.length; i++) {
                    const pathPart = tagPath[i];
                    // check if the pathPart is a systemTag or a regularTag

                    var tagType = this.operations.getMainTagType(tag.fullTagPath);
                    var tagType = tagType + "s"

                    var pathPartName = ""
                    var tagObjects = {}
                    pathPartName = this.tagTree[tagType][tag.fullTagPath].tagName;
                    tagObjects = this.operations.getObjects(tag.fullTagPath);
                    if (!currentLevel.children[pathPart]) {
                        currentLevel.children[pathPart] = {
                            TAG_NAME: pathPartName,
                            OBJECTS: tagObjects,
                            TAG_TYPE: tagType.substring(0, tagType.length - 1),
                            TAG_PATH: tag.fullTagPath,
                            TAG_DATA: this.tagTree[tagType][tag.fullTagPath],
                            "children": {},
                        };
                    }
                    currentLevel = currentLevel.children[pathPart];
                }
            }

            for (const tag of tagListRegularTags) {
                const tagPath = tag.fullTagPath.split(default_config.tagSeparator);
                let currentLevel = renderingTreeRegularTags;

                for (let i = 0; i < tagPath.length; i++) {
                    const pathPart = tagPath[i];
                    // check if the pathPart is a systemTag or a regularTag

                    var tagType = this.operations.getMainTagType(tag.fullTagPath);
                    var tagType = tagType + "s"

                    var pathPartName = ""
                    var tagObjects = {}
                    pathPartName = this.tagTree[tagType][tag.fullTagPath].tagName;
                    tagObjects = this.operations.getObjects(tag.fullTagPath);
                    if (!currentLevel.children[pathPart]) {
                        currentLevel.children[pathPart] = {
                            TAG_NAME: pathPartName,
                            OBJECTS: tagObjects,
                            TAG_TYPE: tagType.substring(0, tagType.length - 1),
                            TAG_PATH: tag.fullTagPath,
                            TAG_DATA: this.tagTree[tagType][tag.fullTagPath],
                            "children": {},
                        };
                    }
                    currentLevel = currentLevel.children[pathPart];
                }
            }

            this.renderedTree = {
                "name":  "Root",
                systemTags: renderingTreeSystemTags,
                regularTags: renderingTreeRegularTags,
            };

            

            return renderingTreeSystemTags;

        },

        this.visualize = {
            tagTree: () => {
                // generate a tree view of the tag tree, get every tag in a list, add to tree structure and remove the tag from the list

                const visualizingTree = {
                    "name": "Root",
                    "children": {}
                }
                const tagList = Object.values(this.tagTree.systemTags).concat(Object.values(this.tagTree.regularTags));

                for (const tag of tagList) {
                    const tagPath = tag.fullTagPath.split(default_config.tagSeparator);
                    let currentLevel = visualizingTree;

                    for (let i = 0; i < tagPath.length; i++) {
                        const pathPart = tagPath[i];
                        // check if the pathPart is a systemTag or a regularTag

                        var tagType = this.operations.getMainTagType(tag.fullTagPath);
                        var tagType = tagType + "s"

                        var pathPartName = ""
                        var tagObjects = {}
                        pathPartName = this.tagTree[tagType][tag.fullTagPath].tagName;
                        tagObjects = this.tagTree[tagType][tag.fullTagPath].objects;
                        if (!currentLevel.children[pathPart]) {
                            currentLevel.children[pathPart] = {
                                "name": pathPartName,
                                "objects": tagObjects,
                                "children": {},
                            };
                        }
                        currentLevel = currentLevel.children[pathPart];
                    }
                }

                return visualizingTree;

            },

            tagTreeFlat: () => {
                // generate a tree view of the tag tree, get every tag in a list, add to tree structure and remove the tag from the list

                const visualizingTree = {
                    ROOT: "Root",
                }
                const tagList = Object.values(this.tagTree.systemTags).concat(Object.values(this.tagTree.regularTags));
                for (const tag of tagList) {
                    const tagPath = tag.fullTagPath.split(default_config.tagSeparator);
                    let currentLevel = visualizingTree;

                    for (let i = 0; i < tagPath.length; i++) {
                        const pathPart = tagPath[i];
                        const prettyPathParts = pathPart.split(default_config.tagSeparator)
                        var prettyPathPart = ""
                        for (const part of prettyPathParts) {
                            prettyPathPart += part.split("---")[0].split("--")[1]
                        }

                        // check if the pathPart is a systemTag or a regularTag
                        var tagType = this.operations.getMainTagType(tag.fullTagPath);
                        var tagType = tagType + "s"

                        var pathPartName = ""
                        pathPartName = this.tagTree[tagType][tag.fullTagPath].tagName;
                        
                        if (!currentLevel[prettyPathPart]) {
                            currentLevel[prettyPathPart] = {
                                "TAG_NAME": pathPartName,
                            };
                        }
                        currentLevel = currentLevel[prettyPathPart];
                    }
                }

                return visualizingTree;

            }
        }


        RhyduxData[this.id] = this;


        
        return this;
    }

    // Public API
    return {
        initialize: function(options) {
            // Default options
            options = options || {
                trashRemovalTime: 30 * 24 * 60 * 60 * 1000, // 30 days
            };
            rhyduxDB = new RhyduxDB(options);
            trashTag = rhyduxDB.operations.createSystemTag("Trash", null, true, {});
            rhyduxDB.trashTag = trashTag.fullTagPath;
            rhyduxDB.operations.editTagProp(trashTag.fullTagPath, "fontAwesomeIcon", "trash");
            return rhyduxDB;
        },

        trashTimeout: null,

        runTrashRemovalCycle: function(atInterval=5000) {

            if (Rhydux.trashTimeout) {
                clearTimeout(Rhydux.trashTimeout);
            }

            // console.log("Running trash removal cycle")
            Rhydux.trashTimeout = setTimeout(() => {

                for (const id in RhyduxData) {
                    if (!RhyduxData[id].trashTag) {
                        return;
                    }

                    // console.log(id)
                    // console.log(RhyduxData)
                    RhyduxData[id].operations.emptyTrash();

                    
                }


                Rhydux.runTrashRemovalCycle(atInterval);

            }, atInterval);
        },

        getRhyduxDBbyId: function(id) {
            return RhyduxDB[id];
        },
        exportRhyduxDB: function(id) {
            rhyduxDB = RhyduxData[id];
            return {
                id: id,
                tagTree: rhyduxDB.tagTree,
                objects: rhyduxDB.objects,
                trashTag: rhyduxDB.trashTag,
                options: rhyduxDB.options
            }
        },
        loadRhyduxDB: function(data={tagTree: {}, objects: {}, id: null, trashTag: null, options: {}}) {
            rhyduxDB = new RhyduxDB({id: data.id});
            rhyduxDB.tagTree = data.tagTree;
            rhyduxDB.objects = data.objects;
            rhyduxDB.id = data.id;
            rhyduxDB.trashTag = data.trashTag;
            rhyduxDB.options = data.options;
            return rhyduxDB;
        }
    };
})();


export default Rhydux;
