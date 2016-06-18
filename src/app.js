'use strict';

var express = require('express');
var mysql = require ('mysql');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');

var app = express();

var connection = mysql.createConnection({
  host     : 'localhost',
	port		 : '8889',
  user     : 'root',
  password : 'root'
});

// Use ADS database
connection.query('USE ADS');

// Static server
app.use('/static', express.static(__dirname + '/public'));
// Use body-parser - Express middleware for routes to access req.body
app.use(bodyParser.urlencoded({extended : false}));
// Cookie parser
app.use(cookieParser('shhhh, very secret'));
// Backend session
app.use(session());
// Get username from session
app.use(function(req, res, next) {
  if (req.session.user) res.locals.username = req.session.user.username;
  next();
});

var router = require('./router')(app, connection);

// Set view engine to Jade
app.set('view engine', 'jade');
app.set('views', __dirname + '/views');

// Server running
app.listen(3000, function(){
	console.log("The frontend server is running on port 3000...");
});
