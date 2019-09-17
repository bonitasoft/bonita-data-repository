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
const fs = require('fs');
let xmlParser = require('xml-js');
let GraphqlSchemaGenerator = require('./GraphqlSchemaGenerator');

function getParameter(param) {
    return param.substr(param.indexOf("=") + 1)
}

let bdmFile;
let port = 4000;

// Handle server parameters
process.argv.forEach(function (val, index, array) {
    if (val.startsWith("bdmFile")) {
        bdmFile = getParameter(val);
    }
    if (val.startsWith("port")) {
        let param = getParameter(val);
        if (!isNaN(param)) {
            port = param;
        } else {
            console.log("Invalid port: " + param);
            process.exit(1);
        }
    }
});

let bdmContentXml = '';
if (bdmFile) {
    bdmContentXml = fs.readFileSync(bdmFile, 'utf8');
    console.log("BDM added: " + bdmFile);
}

let bdm = {
    description: 'Bonitasoft BDM',
    content: bdmContentXml
};

let bdmContentJson = xmlParser.xml2json(bdm.content, {compact: true, spaces: 4});

let schemaGenerator = new GraphqlSchemaGenerator(bdmContentJson);
schemaGenerator.generate();
let schema = schemaGenerator.getSchema();

const resolvers = {
    Query: {
    }
};


const server = new GraphQLServer({
        typeDefs: schema,
        resolvers}
    );

server.start({port: port, endpoint: "/repository"}, () =>
    console.log(`Server is running on http://localhost:${port}`));
