const mysql = require('mysql');

var mysqlConnection = mysql.createConnection({
    host : 'localhost',
    user : 'root',
    password : '',
    database : 'bankqeuing',
    multipleStatements : true
});

mysqlConnection.connect((err) => {
    if (!err){
        console.log('Connected to Database.');
    } else {
        console.log('Connection Failed.');
    }
})

module.exports = mysqlConnection;