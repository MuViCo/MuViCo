const express = require("express")
const net = require("net")
const router = require("./login")

const port = 8080

/*
function sendDataToAllClients(data) {
  clients.forEach((socket) => {
    socket.write(data)
  })
}
*/

/**
 * Creates a TCP server that listens for incoming connections.
 *
 * @param {net.Socket} socket - The socket object representing the connection.
 */
router.post("/createserver", async (req, res) => {
  const server = net.createServer((socket) => {
    socket.write("Hello World!\r\n")
    socket.pipe(socket)

    // Log data received from the client
    socket.on("data", (data) => {
      console.log(`Received from client: ${data}`)
    })
  })
  server.listen(port, () => {
    console.log(`Server listening on port ${port}`)
  })
  res.status(200).send({ message: "Server created" })
})

/**
 * Represents a TCP socket client.
 * @type {net.Socket}
 */
router.post("/connect", async (req, res) => {
  const { ip } = req.body
  const client = new net.Socket()
  client.connect(port, ip, () => {
    console.log("Connected to master")
    client.write("Hello, I am a slave")
  })
  res.status(200).send({ message: "Connected to master" })
})

module.exports = router
