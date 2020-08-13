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
const { addSession, getSessions, getSession, removeSession } = require('./session');

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/videos', express.static(path.join(__dirname, 'videos')));
app.use('/audio', express.static(path.join(__dirname, 'audio')));

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
server.listen(port, () => console.log(`Server running on port ${port}`));

var aTrnTypePrefix = [];
var aQeueDirector = []; var aTrnDirector = [];
loadTranQeueData();
loadTransactionData();

io.sockets.on("connection", socket => {
    checkSession(socket);

    setInterval(() => {
        socket.emit('ping');
    }, 1000);

    socket.on("register", (data) => {
        registerSession(socket, data);
    });

    socket.on("unregister", () => {
        unregisterSession(socket);
    });

    socket.on("getQeueBoard", (data) => {
        updateQeueBoard(socket);
    });

    socket.on("getTellerNewTrn", (data) => {
        getTellerNewTrn(socket, data);
    });

    socket.on("getTellerTrnNumber", (data) => {
        sendTellerTransaction(socket, data);
    });

    socket.on("getTellerQueryTransaction", (data) => {
        sendTellerQueryTransaction(socket, data);
    });
    
    socket.on("callTrnNumber", (pTrnID) => {
        callTellerTransaction(pTrnID);
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

    socket.on("setTrnFinished", (data) => {
        setTrnFinished(socket, data);
    });

    socket.on("disconnect", () => {
        unregisterSession(socket);
    });
});

function checkSession(socket){
    const session = getSession(socket.id);
    if (!session){
        socket.emit('requireRegistration');
    }
}

function registerSession(socket, data){
    const session = getSession(socket.id);
    if (!session){
        addSession(socket.id, data.sessionType);
        console.log('Registered Session: (ID: ' + socket.id + ' Type: ' + data.sessionType + ')')
    }
}

function unregisterSession(socket){
    const session = removeSession(socket.id);
    if (session){
        console.log('Unregistered Session: (ID: ' + session.id + ' Type: ' + session.type + ')');
    }
}

function emitSessionByType(pType, pKey, data){
    const sessions = getSessions();
    const nLength = sessions.length;
    for (var i = 0; i <= (nLength-1); i++){
        if (sessions[i].type == pType){
            io.to(sessions[i].id).emit(pKey, data);
        }
    }
}

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
            aTrnDirector[nArrayID].push(nTrnID);
            var nIndex = aTrnDirector[nArrayID].findIndex((element) => element === nTrnID);
            returnValue = sPrefix + '' + (nIndex+1).toString();
            mysqlConnection.query(`UPDATE transactions SET trnNumber='${(nIndex+1)}' WHERE trnID='${nTrnID}';`
                , (err, rows, fields) => {
                    if (!err){
                        socket.emit("receiveClientNumber", returnValue);
                        emitSessionByType(2, 'updateTellerTrnCount', data);
                    } else {
                        console.log(err);
                    }
            });
        } else {
            console.log(err);
            socket.emit("receiveClientNumber", returnValue);
        }
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

function updateQeueBoard(socket){
    var sValue = ''; var nTrnID = 0;
    var dTodayDate = getCurrentDateString();
    var returnValue = [{
        tellerNumber: 0,
        trnID: 0,
        trnTypeID: 0,
        trnTypeName: '',
        trnNumber: '',
        accName: '',
        accNumber: '',
        trnAmount: 0,
        trnStatus: 0
    }];
    var query = `SELECT t.trnID,t.trnTypeID,t.trnNumber,y.trnTypePrefix,y.trnTypeName,
            t.accName,t.accNumber,t.trnAmount,trnTellerServed,trnStatus
        FROM transactions t JOIN trantypes y ON t.trnTypeID=y.trnTypeID WHERE trnTellerServed > 0 
        AND (trnTimeRequested between '${dTodayDate} 00:00:00' and '${dTodayDate} 23:59:59')
        ORDER BY trnTimeServed DESC LIMIT 6`;
    mysqlConnection.query(query, (err, rows, fields) => {
        if (!err){
            returnValue = [];
            for ( var i = 0; i < rows.length; i++){
                sValue = {
                    tellerNumber: rows[i].trnTellerServed,
                    trnID: rows[i].trnID,
                    trnTypeID: rows[i].trnTypeID,
                    trnTypeName: rows[i].trnTypeName,
                    trnNumber: rows[i].trnTypePrefix + '' + rows[i].trnNumber,
                    accName: rows[i].accName,
                    accNumber: rows[i].accNumber,
                    trnAmount: rows[i].trnAmount,
                    trnStatus: rows[i].trnStatus
                };
                if (rows[i] && i == 0){
                    nTrnID = rows[i].trnID;
                }
                returnValue.push(sValue);
            }
            if (socket){
                socket.emit('updateQeueBoard', returnValue)
            } else {
                emitSessionByType(1, 'updateQeueBoard', returnValue);
                emitSessionByType(1, 'callOutQeueBoard', nTrnID);
            }
        } else {
            console.log(err);
            if (socket){
                socket.emit('updateQeueBoard', returnValue)
            } else {
                emitSessionByType(1, 'updateQeueBoard', returnValue);
            }
        }
    });
}

function getTellerNewTrn(socket, data){
    var sValue = ''; var nTrnTypeID = data.trnTypeID; var nTrnID = 0;
    var nArrayID = (nTrnTypeID - 1); var dTodayDate = getCurrentDateString();
    var returnValue = [{
        tellerNumber: 0,
        trnID: 0,
        trnTypeID: nTrnTypeID,
        trnTypeName: '',
        trnNumber: '',
        accName: '',
        accNumber: '',
        trnAmount: 0,
        trnStatus: 0
    }];
    var query = `SELECT t.trnID,t.trnNumber,y.trnTypePrefix,y.trnTypeName,
            t.accName,t.accNumber,t.trnAmount,trnStatus
        FROM transactions t JOIN trantypes y ON t.trnTypeID=y.trnTypeID
        WHERE trnTellerServed is null AND t.trnTypeID = ${nTrnTypeID}
        AND (trnTimeRequested between '${dTodayDate} 00:00:00' and '${dTodayDate} 23:59:59')
        ORDER BY trnNumber`;
    mysqlConnection.query(query, (err, rows, fields) => {
        if (!err){
            for ( var i = 0; i < rows.length; i++){
                var nIndex = aQeueDirector[nArrayID].findIndex(element => element === rows[i].trnID);
                if (nIndex < 0){
                    nTrnID = rows[i].trnID;
                    sValue = {
                        tellerNumber: data.tellerNumber,
                        trnID: rows[i].trnID,
                        trnTypeID: nTrnTypeID,
                        trnTypeName: rows[i].trnTypeName,
                        trnNumber: rows[i].trnTypePrefix + '' + rows[i].trnNumber,
                        accName: rows[i].accName,
                        accNumber: rows[i].accNumber,
                        trnAmount: rows[i].trnAmount,
                        trnStatus: rows[i].trnStatus
                    };
                    aQeueDirector[nArrayID].push(nTrnID);
                    mysqlConnection.query(`UPDATE transactions SET trnTellerServed='${data.tellerNumber}', trnTimeServed=SYSDATE() WHERE trnID='${nTrnID}'`, (err, rows, fields) => {
                        updateQeueBoard();
                    });
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

function sendTellerTransaction(socket, data){
    var sValue = '';
    var returnValue = [{
        tellerNumber: 0,
        trnID: 0,
        trnTypeID: 0,
        trnTypeName: '',
        trnNumber: '',
        accName: '',
        accNumber: '',
        trnAmount: 0,
        trnStatus: 0
    }];
    var query = `SELECT t.trnID,t.trnNumber,t.trnTypeID,y.trnTypePrefix,y.trnTypeName,
            t.accName,t.accNumber,t.trnAmount,trnStatus
        FROM transactions t JOIN trantypes y ON t.trnTypeID=y.trnTypeID
        WHERE t.trnID=${data.trnID}`;
    mysqlConnection.query(query, (err, rows, fields) => {
        if (!err){
            if (rows.length > 0){
                sValue = {
                    tellerNumber: data.tellerNumber,
                    trnID: rows[0].trnID,
                    trnTypeID: rows[0].trnTypeID,
                    trnTypeName: rows[0].trnTypeName,
                    trnNumber: rows[0].trnTypePrefix + '' + rows[0].trnNumber,
                    accName: rows[0].accName,
                    accNumber: rows[0].accNumber,
                    trnAmount: rows[0].trnAmount,
                    trnStatus: rows[0].trnStatus
                };
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

function sendTellerQueryTransaction(socket, data){
    var sValue = ''; var dTodayDate = getCurrentDateString();
    var returnValue = [{
        tellerNumber: 0,
        trnID: 0,
        trnTypeID: 0,
        trnTypeName: '',
        trnNumber: '',
        accName: '',
        accNumber: '',
        trnAmount: 0,
        trnStatus: 0
    }];
    var query = `SELECT * FROM (
            SELECT t.trnID,t.trnNumber,t.trnTypeID,y.trnTypePrefix,y.trnTypeName,
                t.accName,t.accNumber,t.trnAmount,trnStatus,
                concat(CONVERT(y.trnTypePrefix,char(10)),CONVERT(t.trnNumber,char(10))) as trnNumberString
            FROM transactions t JOIN trantypes y ON t.trnTypeID=y.trnTypeID
            WHERE (trnTimeRequested between '${dTodayDate} 00:00:00' and '${dTodayDate} 23:59:59')
        ) t WHERE trnNumberString='${data.trnNumber}'`;
    mysqlConnection.query(query, (err, rows, fields) => {
        if (!err){
            if (rows.length > 0){
                sValue = {
                    tellerNumber: data.tellerNumber,
                    trnID: rows[0].trnID,
                    trnTypeID: rows[0].trnTypeID,
                    trnTypeName: rows[0].trnTypeName,
                    trnNumber: rows[0].trnTypePrefix + '' + rows[0].trnNumber,
                    accName: rows[0].accName,
                    accNumber: rows[0].accNumber,
                    trnAmount: rows[0].trnAmount,
                    trnStatus: rows[0].trnStatus
                };
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

function callTellerTransaction(pTrnID){
    emitSessionByType(1, 'callOutQeueBoard', pTrnID);
}

function setTrnFinished(socket, data){
    var returnValue = [{ trnStatus: 0 }];
    var nTrnID = data.trnID;
    var query = `UPDATE transactions SET trnTimeFinish=SYSDATE(), trnStatus=1 WHERE trnID='${nTrnID}';`;
    mysqlConnection.query(query, (err, rows, fields) => {
        if (!err){
            console.log('Success');
            returnValue = [];
            returnValue.push({ trnStatus: 1 });
            socket.emit("sendStatus", returnValue);
        } else {
            console.log(err);
            socket.emit("sendStatus", returnValue);
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
                aQeueDirector.push([]);
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
                aQeueDirector[nArrayID].push(rows[i].trnID);
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
                aTrnDirector.push([]);
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
                aTrnDirector[nArrayID].push(rows[i].trnID);
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

function normalizePort(val) {
  var port = parseInt(val, 10);
  if (isNaN(port)) {
    return val;
  }
  if (port >= 0) {
    return port;
  }
  return false;
}

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }
  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;
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

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}