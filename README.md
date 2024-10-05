
# Rhydux 
Rhydux is a JavaScript library designed to facilitate the management of hierarchical tags 🏷️ and objects, providing a flexible framework for organizing, categorizing, and manipulating data. It allows you to build a tag tree system with system tags and regular tags, where tags can have nested relationships and objects can be associated with tags for easy management. The primary use case is for apps that require rich categorization, object tagging, and tag manipulation, such as content management systems, data organization tools, or task management software.

Rhydux is built to simplify common operations like tag creation ✨, deletion ❌, tag-object association 🔗, and tag hierarchy rendering 🌲. This 📖 aims to guide you through the structure and capabilities of Rhydux, including its configuration ⚙️, available functions, and practical usage.

## ⭐ Features

- **Tag Management**: Create ➕, delete ❌, and manage system and regular tags 🏷️. Tags can be nested, allowing for rich hierarchical relationships.
- **Object Management**: Create ➕, update 🔄, and delete ❌ objects 📦 that can be tagged with multiple tags.
- **Flexible Tag Tree Structure**: Tags are organized in a hierarchical structure 🌳, with support for system and regular tags.
- **Trash Management**: Deleted tags and objects can be moved to a trash 🗑️ container, providing a safeguard against accidental deletions.
- **Visualization**: Built-in functions to render and visualize 👀 the tag tree, aiding in understanding and displaying the relationships between tags and objects.

## 🚀 Getting Started

To get started with Rhydux, you need to initialize an instance of the Rhydux database 🗄️. Here is a basic example:

```javascript
import Rhydux from './rhydux';

const rhyduxDB = Rhydux.initialize();
```

You can customize the initialization with options ⚙️, such as setting the trash 🗑️ removal time:

```javascript
const rhyduxDB = Rhydux.initialize({
  trashRemovalTime: 7 * 24 * 60 * 60 * 1000, // Set trash removal time to 7 days 📅
});
```

## ⚙️ Configuration

Rhydux comes with some default configuration options ⚙️ that can be modified as per your requirements:

- **tagSeparator**: The default separator used in tag paths (`"--slashRhydux-"`).
- **maxTagNameLength**: The maximum length allowed for a tag name (`1000` characters).

## 🌟 Core Concepts

### 🌳 Tag Tree

Rhydux maintains two types of tags:

- **System Tags**: Special tags that can be used to categorize 📂 objects at a higher level. Examples include predefined categories or reserved tags like "Trash 🗑️".
- **Regular Tags**: General tags that can be used for freely tagging objects 📦.

The tag tree allows for the creation of nested tags, with tags represented by their full paths, which are constructed using the configured tag separator.

### 📦 Objects

Objects in Rhydux are data entities that can be associated with one or more tags 🏷️. Each object is identified by a unique ID 🔑 and can store custom properties.

## 🔑 Key Functions

### 🏷️ Tag Management

- **createSystemTag(tagName, parentTagPath, userCanAssign, additionalProperties)**: Creates a new system tag under the specified parent.
- **createRegularTag(tagName, parentTagPath, additionalProperties)**: Creates a new regular tag.
- **getTag(tagPath)**: Retrieves a tag by its full path.
- **deleteTag(tagPath)**: Deletes a tag and all of its child tags.
- **editTagName(tagPath, newTagName)**: Changes the name of a specified tag.
- **moveTag(tagPath, newParentTagPath)**: Moves a tag under a new parent.

### 📦 Object Management

- **createObject(objectName, props)**: Creates a new object with the specified properties.
- **changeObject(objectID, newProps)**: Updates the properties of an existing object.
- **deleteObject(objectID)**: Deletes an object from the database.
- **addTagToObject(objectID, tagPath)**: Associates an object with a specified tag.
- **removeTagFromObject(objectID, tagPath)**: Removes a tag association from an object.

### 🗑️ Trash Management

- **moveToTrash(objectID)**: Moves an object to the trash tag.
- **emptyTrash()**: Permanently deletes all objects in the trash that have exceeded the configured removal time.

### 🌲 Tag Tree Visualization

- **renderTagTree()**: Generates a hierarchical representation of the tag tree for viewing purposes 👀.
- **visualize.tagTree()**: Creates a tree structure for visualizing tags and their relationships.

## 🧩 Example Usage

Here's a simple example demonstrating tag and object management using Rhydux:

```javascript
// Initialize Rhydux
const rhyduxDB = Rhydux.initialize();

// Create some tags
const systemTag = rhyduxDB.operations.createSystemTag("System Category");
const regularTag = rhyduxDB.operations.createRegularTag("Project A");

// Create an object
const myObject = rhyduxDB.operations.createObject("Task 1", { description: "Complete the report" });

// Tag the object
rhyduxDB.operations.addTagToObject(myObject.id, systemTag.fullTagPath);
rhyduxDB.operations.addTagToObject(myObject.id, regularTag.fullTagPath);

// Move the object to trash
rhyduxDB.operations.moveToTrash(myObject.id);
```

Rhydux provides a powerful 💪 toolset for managing hierarchical tags 🏷️ and objects 📦, making it ideal for scenarios that require complex data organization 🗂️ and categorization 📂. By leveraging its comprehensive API, you can create rich, nested tag structures 🌳 and easily manage objects with powerful tagging capabilities.

Feel free to explore the different operations available to build an efficient, organized system for managing your app's data 💻.
