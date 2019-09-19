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
const express = require('express');
const graphqlHTTP = require('express-graphql');
const { buildSchema } = require('graphql');
const xmlParser = require('xml-js');
const bodyParser = require('body-parser');
const GraphqlSchemaGenerator = require('./GraphqlSchemaGenerator');
const fs = require('fs');

function getParameter(param) {
    return param.substr(param.indexOf("=") + 1)
}

function getSchema(bdmXml) {
    let bdmJson = xmlParser.xml2json(bdmXml, {compact: true, spaces: 4});
    let schemaGenerator = new GraphqlSchemaGenerator(bdmJson);
    schemaGenerator.generate();
    return buildSchema(schemaGenerator.getSchema());
}

function removeGraphqlRoute() {
    let routes = app._router.stack;
    routes.forEach(removeMiddlewares);

    function removeMiddlewares(route, i, routes) {
        if (route.handle.name === 'graphqlMiddleware') {
            routes.splice(i, 1);
        }
        if (route.route)
            route.route.stack.forEach(removeMiddlewares);
    }
}

function addBdrRoute(graphqlSchema) {
    app.use('/bdr', graphqlHTTP({
        schema: graphqlSchema,
        rootValue: resolvers,
        graphiql: true,
    }));
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

let bdmXml = '';
if (bdmFile) {
    bdmXml = fs.readFileSync(bdmFile, 'utf8');
    console.log("BDM added: " + bdmFile);
}

let schema = buildSchema('type Query { content: String }');
if (bdmFile) {
    schema = getSchema(bdmXml);
}

const resolvers = {
    Query: {
//         content: () => ``
    }
};

var app = express();

addBdrRoute(schema);

// Tell Express to parse application/json
app.use(bodyParser.json());

app.post('/bdm', function (req, res) {
    console.log("BDM pushed.");
    let newSchema = getSchema(req.body.bdmXml);
    // let newSchema = buildSchema('type Query { content2: String }');
    console.log("New schema = " + newSchema);
    // server.close(function() {
    removeGraphqlRoute();
    addBdrRoute(newSchema);
    // server = app.listen(port);
    // });

    res.send();
});


app.listen(port);

console.log('Running a GraphQL API server at localhost:' + port + '/bdr');
