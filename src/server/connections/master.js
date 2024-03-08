const net = require("net");

const server = net.createServer((socket) => {
  socket.write("Hello World!\r\n");
  socket.pipe(socket);
});

server.listen(8080);
