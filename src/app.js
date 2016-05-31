'use strict';

var express = require('express');
var mysql = require ('mysql');
var app = express();
var bodyParser = require('body-parser');

var connection = mysql.createConnection({
  host     : 'localhost',
	port		 : '8889',
  user     : 'root',
  password : 'root'
});

connection.query('USE ADS');

// Static server
app.use('/static', express.static(__dirname + '/public'));

// Use body-parser - Express middleware for routs to access req.body
app.use(bodyParser.urlencoded({extended : false}));

// Set view engine to Jade
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

// API projectlist route
app.get('/api/projects', function(req, res){
  showAllProjects(res);
});

// API newproject form route
app.get('/api/projects/new', function(req, res){
  connection.query('SELECT * FROM categories', function(err, rows){
    res.render('admin/projectForm', {categories : rows});
  });
});

// API newproject submit route
app.post('/api/projects', function(req, res){
  console.log(req.body);
  var query = 'INSERT INTO projects (title, description, authors) VALUES (?, ?, ?)';
  connection.query(query, [req.body.title, req.body.description, req.body.authors], function(err, rows){
    if (err) throw err;
    console.log(rows);
    connection.query('INSERT INTO projects_to_categories (projectId, categoryId) VALUES (?, ?)', [rows.insertId, req.body.categoryId], function(err, rows){
      if (err) throw err;
      console.log(rows);
    });
  });
  showAllProjects(res);
});

// Populate all projects function
function showAllProjects(res) {
  connection.query('SELECT *, projects.id AS projectId FROM projects JOIN images ON projects.id = images.projectId WHERE main = 1', function(err, rows){
    res.render('admin/projectList', {projects : rows});
  });
}

function editProject(){
  var query = '';
}

function deleteProject(){
  var query = '';
}







// Server run
app.listen(3000, function(){
	console.log("The frontend server is running on port 3000...");
});
