const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');

const bodyParser = require('body-parser');
const mysqlConnection = require('./dbconn');
const debug = require('debug')('angular-nodejs:server');
const TrntypeRoutes = require('./routes/trntype');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/videos', express.static(path.join(__dirname, 'videos')));

app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PUT, PATCH, DELETE, OPTIONS');
    next();
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/trntypes", TrntypeRoutes);

server.on('error', onError);
server.on('listening', onListening);
server.listen(port);

var aTrnTypePrefix = [];
var aTransactionQeues = []; var aTransactions = [];
loadTranQeueData();
loadTransactionData();

io.on("connection", socket => {
    console.log('client connected.');
    updateQeueBoard();

    socket.on("getTellerNewTrn", (data) => {
        updateTellerBoard(socket, data);
        updateQeueBoard();
    });

    socket.on("getClientNewTrn", (data) => {
        sendClientNumber(socket, data);
    });

    socket.on("getTrnTypes", () => {
        sendTrnTypes(socket);
    });

    socket.on("getPlayLists", () => {
        sendPlayLists(socket);
    });

    socket.on("disconnect", socket => {
        console.log('client disconnected.');
    });

    io.sockets.emit('newTest', 'test');
});

function sendClientNumber(socket, data){
    var returnValue = ''; var nTrnID = 0;
    var nArrayID = (data.trnTypeID - 1);
    var sPrefix = aTrnTypePrefix[nArrayID];
    var query = `INSERT INTO transactions(trnTypeID,accName,accNumber,trnAmount,trnTimeRequested) 
        VALUES ('${data.trnTypeID}','${data.accName}','${data.accNumber}','${data.trnAmount}',SYSDATE());
        SELECT LAST_INSERT_ID() as trnID;`;
    mysqlConnection.query(query, (err, rows, fields) => {
        if (!err){
            rows.forEach(element => {
                if (element.constructor == Array){
                    nTrnID = element[0].trnID;
                }
            });
            aTransactions[nArrayID].push(nTrnID);
            var nIndex = aTransactions[nArrayID].findIndex((element) => element === nTrnID);
            returnValue = sPrefix + '' + (nIndex+1).toString();
            mysqlConnection.query(`UPDATE transactions SET trnNumber='${(nIndex+1)}' WHERE trnID='${nTrnID}'`);
        } else {
            console.log(err);
        }
        socket.emit("receiveClientNumber", returnValue);
    });
}

function sendTrnTypes(socket){
    var returnValue = [];
    var query = `SELECT trnTypeID,trnTypeName,trnTypePrefix,trnTypeColor FROM trantypes ORDER BY trnTypeSort`;
    mysqlConnection.query(query, (err, rows, fields) => {
        if (!err){
            for ( var i = 0; i < rows.length; i++){
                let rcvValue = {
                    trnTypeID: rows[i].trnTypeID,
                    trnTypeName: rows[i].trnTypeName,
                    trnTypePrefix: rows[i].trnTypePrefix,
                    trnTypeColor: rows[i].trnTypeColor
                };
                returnValue.push(rcvValue);
            }
            socket.emit("receiveTrnTypes", returnValue);
        } else {
            console.log(err);
            socket.emit("receiveTrnTypes", returnValue);
        }
    });
}

function sendPlayLists(socket){
    var returnValue = [];
    var query = `SELECT playFilename FROM playlists WHERE playStatus=1 ORDER BY playSort`;
    mysqlConnection.query(query, (err, rows, fields) => {
        if (!err){
            for ( var i = 0; i < rows.length; i++){
                returnValue.push(rows[i].playFilename);
            }
            socket.emit("receivePlayLists", returnValue);
        } else {
            console.log(err);
            socket.emit("receivePlayLists", returnValue);
        }
    });
}

function updateQeueBoard(){
    var sValue = ''; var dTodayDate = getCurrentDateString();
    var returnValue = [{
        tellerNumber: 0,
        trnTypeID: 0,
        trnTypeName: '',
        trnNumber: '',
        accName: '',
        accNumber: '',
        trnAmount: 0
    }];
    var query = `SELECT t.trnID,t.trnTypeID,t.trnNumber,y.trnTypePrefix,y.trnTypeName,
            t.accName,t.accNumber,t.trnAmount,trnTellerServed
        FROM transactions t JOIN trantypes y ON t.trnTypeID=y.trnTypeID WHERE trnTellerServed > 0 
        AND (trnTimeRequested between '${dTodayDate} 00:00:00' and '${dTodayDate} 23:59:59')
        ORDER BY trnTimeServed DESC LIMIT 6`;
    mysqlConnection.query(query, (err, rows, fields) => {
        if (!err){
            returnValue = [];
            for ( var i = 0; i < rows.length; i++){
                sValue = {
                    tellerNumber: rows[i].trnTellerServed,
                    trnTypeID: rows[i].trnTypeID,
                    trnTypeName: rows[i].trnTypeName,
                    trnNumber: rows[i].trnTypePrefix + '' + rows[i].trnNumber,
                    accName: rows[i].accName,
                    accNumber: rows[i].accNumber,
                    trnAmount: rows[i].trnAmount
                };
                returnValue.push(sValue);
            }
            io.sockets.emit("updateQeueBoard", returnValue);
        } else {
            console.log(err);
            io.sockets.emit("updateQeueBoard", returnValue);
        }
    });
}

function updateTellerBoard(socket, data){
    var sValue = ''; var nTrnTypeID = data.trnTypeID;
    var nArrayID = (nTrnTypeID - 1); var dTodayDate = getCurrentDateString();
    var returnValue = [{
        tellerNumber: 0,
        trnTypeID: nTrnTypeID,
        trnTypeName: '',
        trnNumber: '',
        accName: '',
        accNumber: '',
        trnAmount: 0
    }];
    var query = `SELECT t.trnID,t.trnNumber,y.trnTypePrefix,y.trnTypeName,
            t.accName,t.accNumber,t.trnAmount
        FROM transactions t JOIN trantypes y ON t.trnTypeID=y.trnTypeID
        WHERE trnTellerServed is null AND t.trnTypeID = ${nTrnTypeID}
        AND (trnTimeRequested between '${dTodayDate} 00:00:00' and '${dTodayDate} 23:59:59')
        ORDER BY trnNumber`;
    mysqlConnection.query(query, (err, rows, fields) => {
        if (!err){
            for ( var i = 0; i < rows.length; i++){
                var nIndex = aTransactionQeues[nArrayID].findIndex(element => element === rows[i].trnID);
                if (nIndex < 0){
                    sValue = {
                        tellerNumber: data.tellerNumber,
                        trnTypeID: nTrnTypeID,
                        trnTypeName: rows[i].trnTypeName,
                        trnNumber: rows[i].trnTypePrefix + '' + rows[i].trnNumber,
                        accName: rows[i].accName,
                        accNumber: rows[i].accNumber,
                        trnAmount: rows[i].trnAmount
                    };
                    aTransactionQeues[nArrayID].push(rows[i].trnID);
                    mysqlConnection.query(`UPDATE transactions SET trnTellerServed='${data.tellerNumber}', trnTimeServed=SYSDATE() WHERE trnID='${rows[i].trnID}'`);
                    break;
                }
            }
            returnValue = [];
            returnValue.push(sValue);
            socket.emit("updateTellerBoard", returnValue);
        } else {
            console.log(err);
            socket.emit("updateTellerBoard", returnValue);
        }
    });
}

function loadTranQeueData(){
    var nArrayID = 0;
    var dTodayDate = getCurrentDateString();
    this.aTransactionQeues = []; this.aTrnTypePrefix = [];
    mysqlConnection.query(`SELECT trnTypeID,trnTypeName,trnTypePrefix FROM trantypes order by trnTypeID`, (err, rows, fields) => {
        if (!err){
            for ( var i = 0; i < rows.length; i++){
                aTrnTypePrefix.push(rows[i].trnTypePrefix);
                aTransactionQeues.push([]);
            }
        } else {
            console.log(err);
        }
    });
    var query = `SELECT t.trnTypeID,t.trnNumber,t.trnID FROM transactions t JOIN trantypes y ON t.trnTypeID=y.trnTypeID
        WHERE trnTellerServed > 0 AND (trnTimeRequested between '${dTodayDate} 00:00:00' and '${dTodayDate} 23:59:59')`;
    mysqlConnection.query(query, (err, rows, fields) => {
        if (!err){
            for ( var i = 0; i < rows.length; i++){
                nArrayID = (rows[i].trnTypeID - 1);
                aTransactionQeues[nArrayID].push(rows[i].trnID);
            }
        } else {
            console.log(err);
        }
    });
}

function loadTransactionData(){
    var nArrayID = 0; this.aTransactions = [];
    var dTodayDate = getCurrentDateString();
    mysqlConnection.query(`SELECT trnTypeID,trnTypeName FROM trantypes order by trnTypeID`, (err, rows, fields) => {
        if (!err){
            for ( var i = 0; i < rows.length; i++){
                aTransactions.push([]);
            }
        } else {
            console.log(err);
        }
    });
    var query = `SELECT t.trnTypeID,t.trnNumber,t.trnID FROM transactions t JOIN trantypes y ON t.trnTypeID=y.trnTypeID
        WHERE (trnTimeRequested between '${dTodayDate} 00:00:00' and '${dTodayDate} 23:59:59')
        ORDER BY t.trnTypeID,t.trnNumber`;
    mysqlConnection.query(query, (err, rows, fields) => {
        if (!err){
            for ( var i = 0; i < rows.length; i++){
                nArrayID = (rows[i].trnTypeID - 1);
                aTransactions[nArrayID].push(rows[i].trnID);
            }
        } else {
            console.log(err);
        }
    });
}

function getCurrentDateString(){
    var datetime = new Date();
    var part = datetime.toLocaleDateString().split('/');
    return (part[2] + '-' + part[0] + '-' + part[1]);
}

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}