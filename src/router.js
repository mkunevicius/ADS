var multer = require('multer');
var bcrypt = require('bcrypt');

module.exports = function(app, connection) {

  var storage = multer.diskStorage({
    destination: function (req, file, callback) {
      callback(null, __dirname + '/public/projects/');
    },
    filename: function (req, file, callback) {
      callback(null, file.originalname);
    }
  });

  var upload = multer({ storage : storage });

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

  // Login route
  app.get('/login', function(req, res){
  	res.render("./admin/login");
  });

  // Login submit route
  app.post('/login', function(req, res){
    authenticate(req.body.username, req.body.password, function(err, user){
    	if (user) {
    		console.log('authenticate')
    		req.session.regenerate(function(){
    			req.session.user = user;
    			res.redirect('/api/projects');
    		});
    	} else {
    		console.log('wrong!')
    		res.redirect('/login');
    	}
  	});
  });

  // Logout route
  app.get('/logout', function(req, res){
  	// destroy the user's session to log them out
  	// will be re-created next request
  	req.session.destroy(function(){
  		res.redirect('/login');
  	});
  });

  // Authenticate user & password
  function authenticate(name, pass, fn) {
    connection.query('SELECT * FROM users WHERE username=?', [name], function(err, rows){
      let user = rows[0];
      if (!user) return fn(new Error('cannot find user'));
      bcrypt.compare(pass, user.hash, function(err, res) {
        if (err) return fn(err);
        if (res) {
          return fn(null, user);
        } else {
          fn(new Error('invalid password'));
        }
      });
    });
  }

  // Enter API route
  app.all('/api/*', function(req, res, next){
    console.log('Accessing admin area...');
    if (req.session.user) {
  		next();
  	} else {
  		req.session.error = 'Access denied!';
  		res.redirect('/login');
  	}
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
    function getProject(id, callback){
      var queryProject = 'SELECT * FROM projects JOIN projects_to_categories ON projects.id = projects_to_categories.projectId WHERE projects.id = ?';
      var queryCategory = 'SELECT * FROM categories';
        connection.query(queryProject, [id], function(err, projectRows) {
          connection.query(queryCategory, function(err, categoryRows) {
            connection.query('SELECT image FROM images WHERE images.projectId = ?', [id], function(err, imageRows){
            callback(projectRows[0], categoryRows, imageRows);
          });
        });
      });
    }
    getProject(id, function(project, categories, images){
      res.render('admin/projectForm', {project : project, categories : categories, images: images});
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
  app.post('/api/projects/edit/:id', upload.array('image', 6), function(req, res){
    var id = req.params.id;
    console.log('body: ', req.body);
    console.log('files: ',req.files);
    var queryProject = 'UPDATE ADS.projects SET title = ?, description = ?, authors = ? WHERE projects.id = ?';
    var queryCategory = 'UPDATE ADS.projects_to_categories SET categoryId = ? WHERE projectId = ?';
    var queryImages = 'UPDATE ADS.images SET image = ?, main = ? WHERE rojectId = ?';
    // Update project
    connection.query(queryProject, [req.body.title, req.body.description, req.body.authors, id], function(err, rows){
      if (err) throw err;
      var projectId = rows.insertId;
      // Update project category
      connection.query(queryCategory, [req.body.categoryId, id], function(err, rows){
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

}
