const net = require("net");

// Uncomment this to pass the first stage
const server = net.createServer((socket) => {
  console.log("socket: established");

  socket.on('data' , (data) => {
    console.log('data:', data.toString());
    socket.write("HTTP/1.1 200 OK\r\n\r\n");
    socket.end();
  });

  socket.on("close", () => {
    console.log("socket: on('close')");
    socket.end();
    server.close();
  });
});

server.listen(4221, "localhost");
