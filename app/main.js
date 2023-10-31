const net = require("net");

function generateResponse(statusCode, statusDescription, headers, body) {
  const statusLine = `HTTP/1.1 ${statusCode} ${statusDescription}`;
  const headerLines = Object.entries(headers || []).map(([key, value]) => `${key}: ${value}`);
  const headerBlock = headerLines.join("\r\n");
  const bodyBlock = body ? `\r\n\r\n${body}` : '';
  const response = `${statusLine}\r\n${headerBlock}${bodyBlock}\r\n`;
  return response;
}

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
  console.log("socket: established");

  socket.on('data' , (data) => {
    // Parse first line as HTTP request start line
    const lines = data.toString().split('\r\n');
    const startLine = lines[0];

    // Parse method and path
    const [method, path] = startLine.split(' ');

    // Parse headers
    const headers = {};
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line === '') {
        break;
      }

      const [key, value] = line.split(': ');
      headers[key.toLowerCase()] = value;
    }

    // Paths
    if (path === '/') {
      socket.write(generateResponse(200, 'OK'));
    } else if (path.startsWith("/echo/")) {
      const msg = path.slice(6);
      const msgLength = Buffer.byteLength(msg, "utf8");
      socket.write(generateResponse(200, 'OK', {
        'Content-Type': 'text/plain',
        'Content-Length': msgLength,
      }, msg));
    } else if (path === '/user-agent') {
      const msg = headers['user-agent'];
      const msgLength = Buffer.byteLength(msg, "utf8");
      socket.write(generateResponse(200, 'OK', {
        'Content-Type': 'text/plain',
        'Content-Length': msgLength,
      }, msg));
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
