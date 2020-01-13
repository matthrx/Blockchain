const path = require("path");

const getConfig = function getConfig() {
  if (process.argv.length < 3) {
    console.error("Vous devez indiquer le fichier de configuration");
    throw new Error("Need config filename");
  } else {
    return require(path.resolve(process.argv[2]));
  }
}

const request_args = process.argv[3];
console.log(request_args);
const config = getConfig();
const PORT = config["port"];

const io = require('socket.io-client');

const socket = io(`http://localhost:${PORT}`, {
  path: '/dbyb',
});

console.log(PORT);
socket.on('connect', () => {
  console.log('Connection établie');

  let acc;
  switch(request_args){
    case "get":
      socket.emit('get', process.argv[4], (value) => {
          console.log(`get callback: ${value}`);
          acc = value || 0;
          socket.close()
        });
        break;
    case "set":
      socket.emit('set', process.argv[4], process.argv[5], new Date(), (value) => {
        console.log(`set callback: ${value}`);
        socket.close();
      });
      break;
    case "keys":
      socket.emit('keys', 'test', value => {
        console.log(Object.keys(value));
        socket.close()});
      break;
    }
});
