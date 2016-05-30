'use strict';

var express = require('express');
var mysql = require ('mysql');
var app = express();
var connection = mysql.createConnection({
  host     : 'localhost',
	port		 : '8889',
  user     : 'root',
  password : 'root'
});

connection.query('USE ADS');

app.use('/static', express.static(__dirname + '/public'));

app.set('view engine', 'jade');
app.set('views', __dirname + '/views');

// Home route
app.get('/', function(req, res){
  connection.query('SELECT *, projects.id AS projectId FROM projects JOIN images ON projects.id = images.projectId WHERE main = 1', function(err, rows){
    res.render('index', {projects : rows});
    console.log(err);
    console.log(rows);
  });
});

//Route to particulat project
app.get('/project/:id', function(req, res){
  var id = req.params.id;
  function getProject(id, callback){
      connection.query('SELECT * FROM projects WHERE projects.id = ?', [id], function(err, projectRows) {
        connection.query('SELECT image FROM images WHERE images.projectId = ?', [id], function(err, imageRows){
          callback(projectRows[0], imageRows);
        });
      });
  }
  getProject(id, function(project, images){
    console.log({project : project});
    console.log({images : images});
    res.render('project', {project : project, images: images});
  });
});

// Competitions route
app.get('/competitions', function(req, res){
  getCategory(3, res);
});
// Projects route
app.get('/projects', function(req, res){
  getCategory(2, res);
});
// Realizations route
app.get('/realizations', function(req, res){
  getCategory(1, res);
});

function getCategory(id, res) {
  var query = 'SELECT * FROM projects INNER JOIN images ON projects.id = images.projectId INNER JOIN projects_to_categories ON projects.id = projects_to_categories.projectId WHERE main = 1 AND categoryId = ?';
  connection.query(query, [id], function(err, rows){
    res.render('index', {projects : rows});
  });
}

// About route
app.get('/about', function(req, res){
	res.render("about");
});

// Contact route
app.get('/contact', function(req, res){
	res.render("contact");
});

// Server running
app.listen(3000, function(){
	console.log("The frontend server is running on port 3000...");
});
