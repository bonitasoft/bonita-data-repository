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
const {GraphQLServer} = require('graphql-yoga');
let BdmServer = require('./BdmServer');

module.exports = function(bdmFile) {

// let bdmFile;

// Handle server parameters
    process.argv.forEach(function (val, index, array) {
        if (val.startsWith("bdmFile")) {
            bdmFile = val.substr(val.indexOf("=") + 1);
        }
    });

    const typeDefs = `
    # this is needed for upload to work
scalar Upload

type Query {
  info: String!
  bdm: Bdm!
  bdmTree(filter: String): BdmTree
  bdmTreeAsString(filter: String): BdmTreeAsString
  # bdmTreeItem(qualifiedName: String!): BdmTreeItem
}

type Mutation {
  # Add a bdm from file
  postFile(description: String, file: Upload!): Boolean

  # Add a bdm
  post(description: String, content: String!): Boolean
}

type Bdm {
  description: String
  content: String!
}

type BdmTreeAsString {
    name: String!
    content: String!
}

type BdmTree {
    name: String!
    productVersion: String!
    modelVersion: String!
    nodes: [BdmRootObject!]!
}

type BdmRootObject {
    qualifiedName: String!
    name: String!
    children: [BdmTreeItem!]!
}

union BdmTreeItem = BdmAttribute | BdmRelationObject

type BdmRelationObject {
    name: String!
    reference: String!
    relationType: RelationType!
    fetchType: RelationFetchType!
    mandatory: Boolean!
    multiple: Boolean!
    children: [BdmTreeItem!]!
}

type BdmAttribute {
    name: String!
    type: AttributeType!
    length: Int!
    mandatory: Boolean!
    multiple: Boolean!
}

enum RelationType {
    AGGREGATION
    COMPOSITION
}

enum RelationFetchType {
    LAZY
    EAGER
}

enum AttributeType {
    BOOLEAN
    LOCALDATE
    LOCALDATETIME
    OFFSETDATETIME
    DOUBLE
    FLOAT
    INTEGER
    LONG
    STRING
    TEXT
    DATE
}
    `;

    let resolvers = new BdmServer(bdmFile).getResolvers();

    const server = new GraphQLServer({
        typeDefs,
        resolvers,
    });

    server.start({endpoint: "/repository"}, () => console.log(`Server is running on http://localhost:4000`));
};
