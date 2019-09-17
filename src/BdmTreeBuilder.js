/*
 * Copyright © 2019 Bonitasoft S.A.
 * Bonitasoft, 32 rue Gustave Eiffel - 38000 Grenoble
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
/**
 * Convert a BDM json string into a tree json string
 *
 * @class BdmTreeBuilder
 */
class BdmTreeBuilder {

    constructor(bdmJson, filter) {
        this.bdmJson = bdmJson;
        this.filter = filter;
        this.busObjectsMap = new Map();
    }

    build() {
        return this._bdmAsTree();
    }

    _bdmAsTree() {
        let bdm = JSON.parse(this.bdmJson);

        let bdmTree = {};
        bdmTree.productVersion = bdm.businessObjectModel._attributes.productVersion;
        bdmTree.modelVersion = bdm.businessObjectModel._attributes.modelVersion;
        bdmTree.children = [];

        let bdmBusObjects = BdmTreeBuilder._asArray(bdm.businessObjectModel.businessObjects.businessObject);
        let myself = this;

        // 1st phase: Build root objects, without relations attributes
        bdmBusObjects.forEach(function (bdmBusObject) {
            let treeNode = myself._bdmBusObjectToTreeNode(bdmBusObject);
            myself.busObjectsMap.set(treeNode.name, treeNode);
        });

        // 2nd phase: Build the full tree, embedding relations
        this.busObjectsMap.forEach((treeNode) => {
            let fullTreeNode = myself._embedRelations(treeNode);
            this._treeNodeFiltered(fullTreeNode);
            if (fullTreeNode.children.length !== 0) {
                // we may have no children after filtering
                bdmTree.children.push(fullTreeNode);
            }
        });

        return bdmTree;
    }

    _bdmBusObjectToTreeNode(bdmBusObject) {

        // Business object
        // console.log("business object: " + bdmBusObject.qualifiedName);
        // console.log(bdmBusObject);
        let treeNode = {};
        let qn = bdmBusObject._attributes.qualifiedName;
        treeNode.name = BdmTreeBuilder._getLastItem(qn);
        treeNode.qualifiedName = qn;
        // treeNode.relationType =
        treeNode.children = [];

        // Business object attributes
        let bdmAtts = bdmBusObject.fields.field;
        if (bdmAtts) {
            let bdmAttsArray = BdmTreeBuilder._asArray(bdmAtts);
            bdmAttsArray.forEach((bdmAtt) => {
                let nodeAtt = {};
                nodeAtt.name = bdmAtt._attributes.name;
                nodeAtt.type = bdmAtt._attributes.type;
                nodeAtt.length = bdmAtt._attributes.length;
                nodeAtt.mandatory = !BdmTreeBuilder._asBoolean(bdmAtt._attributes.nullable);
                nodeAtt.multiple = BdmTreeBuilder._asBoolean(bdmAtt._attributes.collection);
                treeNode.children.push(nodeAtt);
            });
        }

        // Business object attribute relations
        let bdmAttRels = bdmBusObject.fields.relationField;
        if (bdmAttRels) {
            let bdmAttRelsArray = BdmTreeBuilder._asArray(bdmAttRels);
            bdmAttRelsArray.forEach((bdmAttRel) => {
                let nodeAttRel = {};
                nodeAttRel.reference = bdmAttRel._attributes.reference;
                nodeAttRel.relationType = bdmAttRel._attributes.type;
                nodeAttRel.fetchType = bdmAttRel._attributes.fetchType;
                nodeAttRel.mandatory = !BdmTreeBuilder._asBoolean(bdmAttRel._attributes.nullable);
                nodeAttRel.multiple = BdmTreeBuilder._asBoolean(bdmAttRel._attributes.collection);
                nodeAttRel.name = bdmAttRel._attributes.name ;
                treeNode.children.push(nodeAttRel);
            });
        }
        return treeNode;
    }

    _embedRelations(treeNode) {
        let myself = this;
        treeNode.children.forEach((nodeAtt) => {
            if (nodeAtt.reference) {
                let referenceName = BdmTreeBuilder._getLastItem(nodeAtt.reference);
                let referenceObject = myself.busObjectsMap.get(referenceName);
                nodeAtt.children = myself._embedRelations(referenceObject).children;
            }
        });
        return treeNode;
    }

    static _getLastItem(path) {
        return path.substring(path.lastIndexOf('.') + 1);
    }

    static _asArray(element) {
        // Put element in an array (if needed)
        let arr;
        if (!Array.isArray(element)) {
            arr = [];
            arr.push(element)
        } else {
            arr = element;
        }
        return arr;
    }

    static _asBoolean(str) {
        // transform string to boolean
        return str === "true";
    }

    _isStringFiltered(item) {
        return !this.filter || item.toLowerCase().includes(this.filter.toLowerCase());
    }

    _treeNodeFiltered(treeNode) {
        if (this._isStringFiltered(treeNode.name)) {
            return;
        }
        let newChildren = [];
        let myself = this;
        treeNode.children.forEach((nodeAtt) => {
            if (this._isStringFiltered(nodeAtt.name)) {
                newChildren.push(nodeAtt);
            } else if (nodeAtt.reference) {
                myself._treeNodeFiltered(nodeAtt);
                if (nodeAtt.children.length !== 0) {
                    // we may have no children after filtering
                    newChildren.push(nodeAtt);
                }
            }
        });
        treeNode.children = newChildren;
    }
}

module.exports = BdmTreeBuilder;
