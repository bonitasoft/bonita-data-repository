const {GraphQLServer} = require('graphql-yoga');
let BdmServer = require('./BdmServer');

let bdmFile;

// Handle server parameters
process.argv.forEach(function (val, index, array) {
    if (val.startsWith("bdmFile")) {
        bdmFile = val.substr(val.indexOf("=") + 1);
    }
});

let resolvers = new BdmServer(bdmFile).getResolvers();

const server = new GraphQLServer({
    typeDefs: './src/schema.graphql',
    resolvers,
});

server.start({endpoint: "/repository"},() => console.log(`Server is running on http://localhost:4000`));