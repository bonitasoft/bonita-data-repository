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
const fs = require('fs');
let BdmTreeBuilder = require('./BdmTreeBuilder');
let xmlParser = require('xml-js');

class BdmServer {

    constructor(bdmFile) {

        let bdmContent = '';

        if (bdmFile) {
            bdmContent = fs.readFileSync(bdmFile, 'utf8');
            console.log("BDM added: " + bdmFile);
        }

        // Only one BDM handled for now
        let bdm = {
            description: 'Bonitasoft BDM',
            content: bdmContent
        };

        const processUpload = async upload => {
            const {createReadStream, filename, mimetype, encoding} = await upload;
            const stream = createReadStream();
            const chunks = [];
            stream.on("data", function (chunk) {
                chunks.push(chunk);
            });
            stream.on("end", function () {
                bdm.content = Buffer.concat(chunks).toString();
                bdm.description = filename;
            });
        };

        this.resolvers = {
            BdmTreeItem: {
                __resolveType(obj, context, info) {
                    if (obj.children) {
                        return 'BdmRelationObject';
                    }

                    if (obj.type) {
                        return 'BdmAttribute';
                    }

                    return null;
                },
            },
            Query: {
                info: () => `This is the API of BDM repository`,
                bdm: () => bdm,
                bdmTree: (parent, args) => {
                    if (bdm.content) {
                        let jsonContent = xmlParser.xml2json(bdm.content, {compact: true, spaces: 4});
                        let jsonTree = new BdmTreeBuilder(jsonContent, args.filter).build();
                        return {
                            name: bdm.description,
                            productVersion: jsonTree.productVersion,
                            modelVersion: jsonTree.modelVersion,
                            nodes: jsonTree.children
                        };
                    } else {
                        return null;
                    }
                },
                bdmTreeAsString: (parent, args) => {
                    if (bdm.content) {
                        let jsonContent = xmlParser.xml2json(bdm.content, {compact: true, spaces: 4});
                        let jsonTree = new BdmTreeBuilder(jsonContent, args.filter).build();
                        return {
                            name: bdm.description,
                            content: JSON.stringify(jsonTree)
                        };
                    } else {
                        return null;
                    }
                }
            },
            Mutation: {
                postFile: (parent, {file}) => {
                    processUpload(file);
                    return true;
                },
                post: (parent, args) => {
                    bdm = {
                        description: args.description,
                        content: args.content,
                    };
                    return true;
                },
            },
        };
    }

    getResolvers() {
        return this.resolvers;
    }
}

module.exports = BdmServer;
