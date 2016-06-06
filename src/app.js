'use strict';

var express = require('express');
var mysql = require ('mysql');
var app = express();
var bodyParser = require('body-parser');
var multer = require('multer');

var storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, __dirname + '/public/projects/');
  },
  filename: function (req, file, callback) {
    callback(null, file.originalname);
  }
});

var upload = multer({ storage : storage });

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
    res.render('admin/projectForm', {project : {}, categories : rows});
  });
});

// API editproject form route
app.get('/api/projects/edit/:id', function(req, res){
  var id = req.params.id;

  connection.query('SELECT * FROM projects JOIN projects_to_categories ON projects.id = projects_to_categories.projectId WHERE projects.id = ?', [id], function(err, projectRows) {

    connection.query('SELECT * FROM categories', function(err, rows){
      res.render('admin/projectForm', {project : projectRows[0], categories : rows });
    });
  });
});

// API newproject submit route
app.post('/api/projects', upload.array('image', 6), function(req, res){
  console.log('body: ', req.body);
  console.log('files: ',req.files);

  var queryProject = 'INSERT INTO projects (title, description, authors) VALUES (?, ?, ?)';
  var queryCategory = 'INSERT INTO projects_to_categories (projectId, categoryId) VALUES (?, ?)';
  var queryImages = 'INSERT INTO images (projectId, image, main) VALUES (?, ?, ?)';
  // Insert project into projects table
  connection.query(queryProject, [req.body.title, req.body.description, req.body.authors], function(err, rows){
    if (err) throw err;

    var projectId = rows.insertId;
    // Insert project category into projects_to_categories table
    connection.query(queryCategory, [projectId, req.body.categoryId], function(err, rows){
      if (err) throw err;
      // Insert project images into images table
      req.files.forEach((file, index) => {
        connection.query(queryImages, [projectId, '/static/projects/'+file.filename, index === 0], function(err, rows){
           if (err) throw err;
           console.log(rows);
        });
      });
    });
  });
  res.redirect('/api/projects');
});

// API editproject submit route
app.put('/api/projects', upload.array('image', 6), function(req, res){
  console.log('body: ', req.body);
  console.log('files: ',req.files);

  var queryProject = 'UPDATE ADS.projects SET title = ?, description = ?, authors = ? WHERE projects.id = ?';
  var queryCategory = 'UPDATE ADS.projects_to_categories SET categoryId = ? WHERE projectId = ?';
  var queryImages = 'UPDATE ADS.images SET image = ?, main = ? WHERE rojectId = ?';

  // Update project
  connection.query(queryProject, [req.body.title, req.body.description, req.body.authors, req.body.id], function(err, rows){
    if (err) throw err;
    var projectId = rows.insertId;
    // Update project category
    connection.query(queryCategory, [req.body.categoryId, req.body.id], function(err, rows){
      if (err) throw err;
      // Update project images
      req.files.forEach((file, index) => {
        connection.query(queryImages, ['/static/projects/'+file.filename, index === 0], function(err, rows){
           if (err) throw err;
           console.log(rows);
        });
      });
    });
  });
  res.redirect('/api/projects');
});





// API delete project route
app.get('/api/projects/delete/:id', function(req, res){
  var id = req.params.id;
  var queryDeleteProject = 'DELETE FROM ADS.projects WHERE projects.id = ?';
  connection.query(queryDeleteProject, [id], function(err,rows){
    if (err) throw err;
  });
  res.redirect('/api/projects');
});

// Show all projects
function showAllProjects(res) {
  var queryAllProjects = 'SELECT *, projects.id AS projectId FROM projects JOIN images ON projects.id = images.projectId WHERE main = 1';
  connection.query(queryAllProjects, function(err, rows){
    res.render('admin/projectList', {projects : rows});
  });
}

function getCategories(){
  var result;
  connection.query('SELECT * FROM categories', function(err, rows){
    result = rows;
  });
  return result;
}

// Server running
app.listen(3000, function(){
	console.log("The frontend server is running on port 3000...");
});
