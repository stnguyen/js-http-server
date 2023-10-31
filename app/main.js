const net = require("net");

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
  console.log("socket: established");

  socket.on('data' , (data) => {
    // Parse first line as HTTP request start line
    const lines = data.toString().split('\r\n');
    const startLine = lines[0];

    // Parse method and path
    const [method, path] = startLine.split(' ');

    if (path === '/') {
      socket.write("HTTP/1.1 200 OK\r\n\r\n");
    } else if (path.startsWith("/echo/")) {
      const msg = path.slice(6);
      const msgLength = Buffer.byteLength(msg, "utf8");
      socket.write(`HTTP/1.1 200 OK
Content-Type: text/plain
Content-Length: ${msgLength}

${msg}
      `.replace(/\n/g, "\r\n"));

    } else {
      socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
    }

    socket.end();
  });

  socket.on("close", () => {
    console.log("socket: on('close')");
    socket.end();
    server.close();
  });
});

server.listen(4221, "localhost");
