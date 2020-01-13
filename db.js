const path = require("path");
const io_client = require('socket.io-client');
const Server = require('socket.io');
const crypto = require('crypto');

// TO DO -- CLI INTERFACE


const getConfig = function getConfig() {
  if (process.argv.length < 3) {
    console.error("Vous devez indiquer le fichier de configuration");
    throw new Error("Need config filename");
  } else {
    return require(path.resolve(process.argv[2]));
  }
}

const config = getConfig();
const PORT = config["port"];
const io = new Server(PORT, {
  path: '/dbyb',
  serveClient: false,
});

let distribued_array = [];
config["friends"].map(
  port => {
    console.log(port);
    let socket = io_client(`http://localhost:${port}`, {
      path: '/dbyb',
    });
    distribued_array.push(socket);
  }
);

let db = Object.create(null);
let all_keys = Object.create(null);

const initialize = () => {
    if (config["friends"].length != 0){
      let get_keys = io_client(`http://localhost:${config["friends"][0]}`, {
        path: '/dbyb',
      });
      get_keys.on('connect', () => {
          get_keys.emit('keys', '', resp => {
            Object.keys(resp).map(() => { elt =>{
              if (!(elt in Object.keys(db))){
                console.log("Lokking for a new value")
                get_keys.emit('get', elt, (value) => {db.push({elt, value})})
              }
            }})
          })
      })
    }

}

const getHash = function getHash(data) {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}


const extractHorodatage = function(db) {
  return Object.keys(db).reduce(function(result, key) {
    result[key] = {
      time: db[key].time
    };
    return result;
  }, {});
};

const updateKeysAndTime = () => {
  console.log("Checking keys...")
    let keysTime = Object.create(null);
    distribued_array.map(
      (socket) => {
          socket.emit('keys', '', (value) => {
          Object.keys(value).map(
            key => {
              if (!(key in Object.keys(all_keys)) || value[key].time < all_keys[key].time){
                all_keys[key] = {
                  time : value[key].time
                }
              }}
    )

})})
  console.log(all_keys)}

const frequentCallKeysTime = interval => {
    setInterval(
      updateKeysAndTime, interval
    )

}


initialize();
frequentCallKeysTime(10000);
console.log(db)

console.log(`Serveur lancé sur le port ${PORT}.`);


io.on('connect', (socket) => {
  console.log('Nouvelle connexion');

  socket.on('get', function(field, callback){
    console.log(`get ${field}: ${db[field].value}`);
    callback(db[field].value);
  });

  socket.on('set', function(field, value, time, callback){
    if (field in db) {
      let myDate = db[field].time;
      if (myDate > new Date(time)){ //Pas couvert si les timestamps sont parfaitement égaux.
        db[field]= {
          value:value,
          time:time
        }
        callback(true)
      }
      //db[field] = value; la clé existe déjà, on ne l'update pas
      callback(false); // comportement à avoir si la clé existe déjà.
    } else {
      console.log(`set ${field} : ${value}`);
      let time = new Date()
      db[field] = {
        value :value,
        time: time
      }
      all_keys[field] = time;
      setTimeout( () => {
        config["friends"].map(
          port => {
            let socket = io_client(`http://localhost:${port}`, {
              path: '/dbyb',
            });
            console.log("Sending data to others...");
            socket.on('connect', () => {
              console.log("Connecting")
              socket.emit('set', field, value, time, (resp) => {
                console.log("set ",resp);
            });
              socket.close();
          }
      )
    })
  }, 1000)
  callback(true); // clé n'existe pas encore
;}})

  socket.on('keys', function(field, callback){
    let keys_time = extractHorodatage(db);
    callback(keys_time);
  });
});
