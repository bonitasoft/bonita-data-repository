var http = require('http');

let port = process.env.PORT || 4000;


let server = http.createServer(function (req, res) {
    res.writeHead(200);
    res.end(`Server is running on http://localhost:${port}`);
});
server.listen(port);

