const net = require("net")

const client = new net.Socket()
client.connect(8080, master_ip, () => {
  console.log("Connected to master")
  client.write("  Hello, I am a slave")
})
