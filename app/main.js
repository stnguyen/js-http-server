const net = require("net");
const fs = require('fs').promises;

// Read --directory argument
const args = process.argv.splice(2);
let directory = undefined;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--directory') {
    directory = args[i + 1];
  }
}


function generateResponse(statusCode, statusDescription, headers, body) {
  const statusLine = `HTTP/1.1 ${statusCode} ${statusDescription}`;
  const headerLines = Object.entries(headers || []).map(([key, value]) => `${key}: ${value}`);
  const headerBlock = headerLines.join("\r\n");
  const bodyBlock = body ? `\r\n${body}` : '';
  const response = `${statusLine}\r\n${headerBlock}\r\n${bodyBlock}`;
  return response;
}

const server = net.createServer((socket) => {
  socket.on('data', async (data) => {
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

    } else if (path.startsWith("/files/") && method === 'GET') {
      const fileName = path.slice(7);
      const filePath = `${directory}/${fileName}`;
      
      try {
        // Read file and return as application/octet-stream
        const fileContent = await fs.readFile(filePath);
        const fileLength = Buffer.byteLength(fileContent);
        socket.write(generateResponse(200, 'OK', {
          'Content-Type': 'application/octet-stream',
          'Content-Length': fileLength,
        }, fileContent));
      }
      catch (e) {
        console.error(e);
        socket.write(generateResponse(404, 'Not Found'));
      }

    } else if (path.startsWith("/files/") && method === 'POST') {
      const fileName = path.slice(7);
      const filePath = `${directory}/${fileName}`;
      const fileContent = lines[lines.length - 1];
      try {
        await fs.writeFile(filePath, fileContent);
        socket.write(generateResponse(201, 'OK'));
      }
      catch (e) {
        console.error(e);
        socket.write(generateResponse(500, 'Internal Server Error'));
      }
    
    } else {
      socket.write(generateResponse(404, 'Not Found'));
    }

    socket.end();
  });

});

server.listen(4221, "localhost");
