var express       = require('express');
var app           = express();
var path          = require('path');
var fs            = require('fs');
var bodyParser    = require('body-parser');
var cookieParser  = require('cookie-parser');
var uuidv4        = require('uuid/v4');

app.use(cookieParser('uid'));

app.use('/',express.static(path.join(__dirname, 'views')));

app.use(bodyParser.json({limit:1024*1024*20, type:'application/json'}));

app.use(bodyParser.json());

app.use(bodyParser.json({uploadDir:'/public/photos'}));

app.use(express.static(__dirname + '/public'));

app.set('css', __dirname + '/public/css');
app.set('js', __dirname + '/public/js');
app.set('photos', __dirname + '/public/photos');

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.get('/', function(request, response) {
  response.render('main.html');
});


var port = process.env.PORT || 8080;

app.post('/register/:username/:password',  function(req, res, next) {
    var userExist = false;
    var user = {};
    user.username = req.params.username;
    user.password = req.params.password;
    user.uid = "";
    user.public = true;
    user.userId = uuidv4();
    user.inbox = [];

    fs.readFile('users.json', 'utf8', function readFileCallback(err, data){
        if (err){
            console.log(err);
        } else {
        var users = JSON.parse(data);
        if (users.length == 0){
        	users.table.push(user);
          fs.writeFile('users.json', json, 'utf8', function(){
            res.sendStatus(200);
          });
        }
        else {
          users.table.forEach(function(registeredUser, index) {
            if (registeredUser.username == user.username){
              userExist = true;
              res.sendStatus(500);
            }
          });
          if(!userExist){
            users.table.push(user);
            var json = JSON.stringify(users); //convert it back to json

            fs.writeFile('users.json', json, 'utf8', function(){
              res.sendStatus(200);
            });
          }
        }
    }});
  });

app.post('/login/:username/:password', function(req, res, next) {

	var LoginSuccess = false;
    var user = {};
    user.username = req.params.username;
    user.password = req.params.password;
    fs.readFile('users.json', 'utf8', function readFileCallback(err, data){
        if (err){
            console.log(err);
        } else {
        var users = JSON.parse(data);
        if (users.table.length == 0){
          res.sendStatus(500);
        }
        else {
          users.table.forEach(function(registeredUser, index) {
            if (registeredUser.username == user.username){
              if(registeredUser.password == user.password){
                users.table[index].uid = uuidv4();
                var json = JSON.stringify(users); //convert it back to json
                res.cookie('uid', registeredUser.uid, {maxAge : 60 * 60 * 1000});
                res.cookie('userId', registeredUser.userId);
                LoginSuccess = true;

                fs.writeFile('users.json', json, 'utf8', function(){
                  res.sendStatus(200);
                });
              }
            }
          });
          if(!LoginSuccess){
            res.sendStatus(500);
          }
        }
    }});
  });

  app.post('/changePassword/:username/:password',  function(req, res, next) {
      var userExist = false;
      var user = {};
      user.username = req.params.username;
      user.password = req.params.password;
      user.uid = uuidv4();
      user.userId = "";

      fs.readFile('users.json', 'utf8', function readFileCallback(err, data){
          if (err){
              console.log(err);
          } else {
          var users = JSON.parse(data);
          if (users.length == 0){
              user.userId = uuidv4();
              user.public = true;
              user.inbox = [];
          	  users.table.push(user);

              fs.writeFile('users.json', json, 'utf8', function(){
                res.cookie('uid', user.uid, {maxAge : 60 * 60 * 1000});
                res.cookie('userId', user.userId);
                res.sendStatus(200);
            });
          }
          else {
            users.table.forEach(function(registeredUser, index) {
              if (registeredUser.username == user.username){
                userExist = true;
                user.userId = registeredUser.userId;
                user.public = registeredUser.public;
                user.inbox = registeredUser.inbox;
                users.table[index] = user;
                var json = JSON.stringify(users); //convert it back to json

                fs.writeFile('users.json', json, 'utf8', function(){
                  res.cookie('uid', user.uid, {maxAge : 60 * 60 * 1000});
                  console.log("changePassword");
                  res.sendStatus(200);
                });
              }
            });
            if(!userExist){
              res.sendStatus(500);
            }
          }
      }});
    });

app.post('/updateSecurity/:public',  function(req, res, next) {
    var userExist = false;
    var user = {};

    fs.readFile('users.json', 'utf8', function readFileCallback(err, data){
        if (err){
            console.log(err);
        } else {
          var users = JSON.parse(data);
          if (users.table.length == 0){
            console.log("No users");
            res.sendStatus(500);
          }
          else {
            console.log(req.params.public);
            var isPublic = req.params.public === "true";
            users.table.forEach(function(registeredUser, index) {
            	if (registeredUser.uid == req.cookies.uid){
                  userExist = true;
                  users.table[index].public = isPublic;
                  var newToken = uuidv4();
                  users.table[index].uid = newToken;
                  var json = JSON.stringify(users);
                  fs.writeFile('users.json', json, 'utf8', function(){
                    fs.readFile('Recipes.json', 'utf8', function readFileCallback(err, data){
                        if (err){
                          console.log(err);
                        } else {
                          recipes = JSON.parse(data);
                          recipes.table.forEach(function(itemInList, index) {
                             if (itemInList.userId == req.cookies.userId){
                                recipes.table[index].public = isPublic;
                             }
                          });

                          json = JSON.stringify(recipes);
                          fs.writeFile('Recipes.json', json, 'utf8', function(){
                            res.cookie('uid', newToken, {maxAge : 60 * 60 * 1000});
                            console.log("change Security");
                            res.sendStatus(200);
                          });
                        }
                      });
                  });
                }
              });
            }
          if(!userExist){
            res.sendStatus(500);
          }
        }
    });
  });

  app.get('/security', function(req, res, next) {
    var userOK = false;
    fs.readFile('users.json', 'utf8', function readFileCallback(err, data){
        if (err){
            console.log(err);
        } else {
          var users = JSON.parse(data);
            users.table.forEach(function(registeredUser, index) {
              if (registeredUser.uid == req.cookies.uid){
                userOK = true;
                res.status(200).json(registeredUser.public);
              }
            });

            if(!userOK){
              res.sendStatus(500);
            }
          }
  	 });
  });


app.post('/item', function(req, res, next) {
  var userOK = false;
  fs.readFile('users.json', 'utf8', function readFileCallback(err, data){
      if (err){
          console.log(err);
      } else {
        var users = JSON.parse(data);
        if (users.table.length == 0){
          console.log("No users");
          res.sendStatus(500);
        }
        else {
          users.table.forEach(function(registeredUser, index) {
          	if (registeredUser.uid == req.cookies.uid){
                var item = {};
          		  item.uuid = uuidv4();
                item.views = [];
                item.views.push("dorTest");
                item.date = new Date();
          		  item.data = req.body;
                item.public = registeredUser.public;
                item.userId = registeredUser.userId;

                fs.readFile('Recipes.json', 'utf8', function readFileCallback(err, data){
                    if (err){
                        console.log(err);
                    } else {
                    recipes = JSON.parse(data);
                    recipes.table.push(item);
                    json = JSON.stringify(recipes);
                    fs.writeFile('Recipes.json', json, 'utf8', function(){
                      res.sendStatus(200);
                    });
                }});
                userOK = true;
          	}
          });
          if(!userOK){
            res.sendStatus(500);
          }
        }
      }
    });
  });

app.get('/items', function(req, res, next) {
  var userOK = false;
  fs.readFile('users.json', 'utf8', function readFileCallback(err, data){
      if (err){
          console.log(err);
      } else {
        console.log("read users");
        var users = JSON.parse(data);
          users.table.forEach(function(registeredUser, index) {
            if (registeredUser.uid == req.cookies.uid){
                console.log("found user");
              userOK = true;
              fs.readFile('Recipes.json', 'utf8', function readFileCallback(err, data){
                  if (err){
                      console.log(err);
                  } else {
                    recipes = JSON.parse(data);
                    console.log("response id");
                    if(recipes.table.length == 0){
                        res.sendStatus(200);
                    }
                    else{
                      recipes.table = recipes.table.filter(function(item) {
                            return (item.public === true || item.userId === req.cookies.userId);
                      });
                      res.status(200).json(recipes.table);
                    }
                  }
                });
    		     }
	        });
        if(!userOK){
            console.log("not found user");
            res.sendStatus(500);
        }
      }
  });
});

app.get('/myRecipes/:userId', function(req, res, next) {
  var userOK = false;
  fs.readFile('users.json', 'utf8', function readFileCallback(err, data){
      if (err){
          console.log(err);
      } else {
        var users = JSON.parse(data);
          users.table.forEach(function(registeredUser, index) {
            if (registeredUser.uid == req.cookies.uid){
              userOK = true;
              var userId = req.params.userId;
              fs.readFile('Recipes.json', 'utf8', function readFileCallback(err, data){
                  if (err){
                      console.log(err);
                  } else {
                    recipes = JSON.parse(data);
              		  if (recipes.table.length == 0){
              			       res.sendStatus(200);
              		  }
             		 	  else {
                        matchRecipes = [];
          		          recipes.table.forEach(function(itemInList, index) {
          		        	if (itemInList.userId == userId){
                          matchRecipes.push(itemInList);
          		        	}
          		        });
                      if(matchRecipes.length == 0){
                        res.sendStatus(200);
                      } else{
                        res.status(200).json(matchRecipes);
                      }
                    }
    		        }
	           });
           }
         });
        if(!userOK){
          res.sendStatus(500);
        }
      }
    });
});

app.get('/item/:id', function(req, res, next) {
  var userOK = false;
  var userAllreadyRated = false;
  var itemExist = false;
  fs.readFile('users.json', 'utf8', function readFileCallback(err, data){
      if (err){
          console.log(err);
      } else {
        var users = JSON.parse(data);
          users.table.forEach(function(registeredUser, index) {
            if (registeredUser.uid == req.cookies.uid){
              userOK = true;
              var id = req.params.id;
              fs.readFile('Recipes.json', 'utf8', function readFileCallback(err, data){
                  if (err){
                      console.log(err);
                  } else {
                    recipes = JSON.parse(data);
              		  if (recipes.table.length == 0){
                        res.sendStatus(404);
              		  }
             		 	  else {
                      recipes.table.forEach(function(itemInList, index) {
                      if (itemInList.uuid == id){
                          itemExist = true;
                          itemInList.views.forEach(function(userRated, index) {
                            if(userRated == req.cookies.userId){
                              userAllreadyRated = true;
                            }
                          });
                          if(!userAllreadyRated){
                            recipes.table[index].views.push(req.cookies.userId);
                          }
                          json = JSON.stringify(recipes);

                          fs.writeFile('Recipes.json', json, 'utf8', function(){
                            res.status(200).json(recipes.table[index]);
                          });
                      }
                    });
                    if(!itemExist){
                        res.sendStatus(404);
                    }
                  }
    		        }
	           });
           }
         });
        if(!userOK){
          res.sendStatus(500);
        }
      }
    });
});

app.post('/ShareWith/:userName/:RecipeId',  function(req, res, next) {
    var userOK = false;
    var userExist = false;
    var user = {};

    fs.readFile('users.json', 'utf8', function readFileCallback(err, data){
        if (err){
            console.log(err);
        } else {
          var users = JSON.parse(data);
            var ShareWith = req.params.userName;
            console.log(ShareWith);
            users.table.forEach(function(registeredUser, index) {
            	if (registeredUser.uid == req.cookies.uid){
                  console.log("user found");
                  userOK = true;
                  users.table.forEach(function(registeredUser, index) {
                  	if (registeredUser.username == ShareWith){
                        userExist = true;
                        var item = {};
                        item.RecipeId = req.params.RecipeId;

                        var alreadyHaveThatRecipe = registeredUser.inbox.filter(function(recipe){
                          return recipe.RecipeId === item.RecipeId
                        })

                        if(alreadyHaveThatRecipe.length > 0){
                          res.status(200).json(ShareWith + " already have that recipe");
                          res.end;
                        } else{
                          item.ReadAlready = false;

                          users.table[index].inbox.push(item);
                          var json = JSON.stringify(users);
                          fs.writeFile('users.json', json, 'utf8', function(){
                              res.status(200).json("Success share recipe with " + ShareWith);
                              res.end;
                          });
                        }
                      }
                  });
                  if(!userExist){
                    res.status(200).json("No user under the name: " + ShareWith);
                    res.end;
                  }
                }
              });
              if(!userOK){
                res.sendStatus(500);
                res.end;
              }
          }
      });
  });

app.get('/HaveNewInbox', function(req, res) {
  var userOK = false;
  fs.readFile('users.json', 'utf8', function readFileCallback(err, data){
      if (err){
          console.log(err);
      } else {
        var users = JSON.parse(data);
          users.table.forEach(function(registeredUser, index) {
            if (registeredUser.uid == req.cookies.uid){
              userOK = true;
              var inbox = [];
              registeredUser.inbox.forEach(function(item, itemIndex) {
                if(!item.ReadAlready){
                  users.table[index].inbox[itemIndex].ReadAlready = true;
                  inbox.push(item);
                };
              });
              var json = JSON.stringify(users);
              fs.writeFile('users.json', json, 'utf8', function(){
                  res.status(200).json(inbox);
              });
            }
          });
          if(!userOK){
            res.sendStatus(500);
          }
        }
      });
  });

  app.delete('/inboxRecipe/:recipeId', function(req, res) {
    fs.readFile('users.json', 'utf8', function readFileCallback(err, data){
        if (err){
            console.log(err);
        } else {
          var users = JSON.parse(data);
            users.table.forEach(function(registeredUser, index) {
              if (registeredUser.uid == req.cookies.uid){
                userOK = true;
                var recipeId = req.params.recipeId;

                users.table[index].inbox = registeredUser.inbox.filter(function(item) {
                  return item.RecipeId !== recipeId;
                });

                var json = JSON.stringify(users);
                fs.writeFile('users.json', json, 'utf8', function(){
                    res.sendStatus(200);
                });
              }
            });
            if(!userOK){
              res.sendStatus(500);
            }
          }
        });
    });

  app.get('/inbox', function(req, res) {
    var userOK = false;
    fs.readFile('users.json', 'utf8', function readFileCallback(err, data){
        if (err){
            console.log(err);
        } else {
          var users = JSON.parse(data);
            users.table.forEach(function(registeredUser, index) {
              if (registeredUser.uid == req.cookies.uid){
                userOK = true;
                var inbox = [];
                fs.readFile('Recipes.json', 'utf8', function readFileCallback(err, data){
                    if (err){
                        console.log(err);
                    } else {
                      recipes = JSON.parse(data);
                      registeredUser.inbox.forEach(function(item, itemIndex) {
                        var recipe = recipes.table.filter(function(recipe){
                          return recipe.uuid === item.RecipeId;
                        });
                        if(recipe.length != 0){
                          inbox.push(recipe[0]);
                        }
                      });

                      res.status(200).json(inbox);
                    }
                });
              }
            });
            if(!userOK){
              res.sendStatus(500);
            }
          }
        });
    });

app.delete('/items/:userId', function(req, res) {
  fs.readFile('users.json', 'utf8', function readFileCallback(err, data){
      if (err){
          console.log(err);
      } else {
        var users = JSON.parse(data);
          users.table.forEach(function(registeredUser, index) {
            if (registeredUser.uid == req.cookies.uid){
              userOK = true;
              var userId = req.params.userId;
              fs.readFile('Recipes.json', 'utf8', function readFileCallback(err, data){
                  if (err){
                      console.log(err);
                  } else {
                    recipes = JSON.parse(data);
              		  if (recipes.table.length == 0){
              			     res.sendStatus(200);
              		  }
             		 	  else {
                      recipes.table = recipes.table.filter(function(item) {
                            return item.userId !== userId;
                      });

                      json = JSON.stringify(recipes);

                      fs.writeFile('Recipes.json', json, 'utf8', function(){
                        res.sendStatus(200);
                      });
                    }
    		        }
	           });
           }
         });
        if(!userOK){
          res.sendStatus(500);
        }
      }
    });
});


app.delete('/item/:recipeId', function(req, res) {
  fs.readFile('users.json', 'utf8', function readFileCallback(err, data){
      if (err){
          console.log(err);
      } else {
        var users = JSON.parse(data);
          users.table.forEach(function(registeredUser, index) {
            if (registeredUser.uid == req.cookies.uid){
              userOK = true;
              var recipeId = req.params.recipeId;
              fs.readFile('Recipes.json', 'utf8', function readFileCallback(err, data){
                  if (err){
                      console.log(err);
                  } else {
                    recipes = JSON.parse(data);
              		  if (recipes.table.length == 0){
              			     res.sendStatus(200);
              		  }
             		 	  else {
                      recipes.table = recipes.table.filter(function(item) {
                            return item.uuid !== recipeId;
                      });

                      json = JSON.stringify(recipes);

                      fs.writeFile('Recipes.json', json, 'utf8', function(){
                        res.sendStatus(200);
                      });
                    }
    		        }
	           });
           }
         });
        if(!userOK){
          res.sendStatus(500);
        }
      }
    });
});

app.delete('/deleteUser', function(req, res) {
  fs.readFile('users.json', 'utf8', function readFileCallback(err, data){
      if (err){
          console.log(err);
      } else {
          var users = JSON.parse(data);
          users.table.forEach(function(registeredUser, index) {
            if (registeredUser.uid == req.cookies.uid){
              userOK = true;
              users.table.splice(index, 1);

              json = JSON.stringify(users);

              fs.writeFile('users.json', json, 'utf8', function(){
                res.sendStatus(200);
              });
            }
	        });
        if(!userOK){
          res.sendStatus(500);
        }
      }
    });
	});

app.delete('/item/:id', function(req, res) {
  var userOK = false;
  var itemExist = false;
	users.forEach(function(registeredUser, index) {
        if (registeredUser.uid == req.cookies.uid){
        	registeredUser.uid = uuidv4();
          userOK = true;
			    var id = req.params.id;
		    if (items.length == 0){
          res.sendStatus(404);
		    }
		    else {
		        items.forEach(function(itemInList, index) {
		        	if (itemInList.id == id){
		        		items.splice(index, 1);
                res.sendStatus(200);
                itemExist = true;
		        	}
		        });
            if(!itemExist){
		            res.sendStatus(404);
            }
			}
		}
	});

  if(!userOK){
      res.sendStatus(500);
}
});

app.put('/item/:id', function(req, res) {
  var userOK = false;
  var itemExist = false;
  fs.readFile('users.json', 'utf8', function readFileCallback(err, data){
      if (err){
          console.log(err);
      } else {
        var users = JSON.parse(data);
        if (users.table.length == 0){
          console.log("No users");
          res.sendStatus(500);
        }
        else {
          users.table.forEach(function(registeredUser, index) {
            if (registeredUser.uid == req.cookies.uid){
                fs.readFile('Recipes.json', 'utf8', function readFileCallback(err, data){
                    if (err){
                        console.log(err);
                    } else {
                    var id = req.params.id;
                    recipes = JSON.parse(data);
                    recipes.table.forEach(function(itemInList, index) {
                      if (itemInList.uuid == id){
                        itemExist = true;
                        var item = {};
                        item.uuid = itemInList.uuid;
                        item.views = itemInList.views;
                        item.date = new Date();
                        item.data = req.body;
                        item.userId = registeredUser.userId;

                        recipes.table[index] = item;
                      }
                    });

                    json = JSON.stringify(recipes);
                    fs.writeFile('Recipes.json', json, 'utf8', function(){
                      res.sendStatus(200);
                    });
                }});
                userOK = true;
              }
          });
          if(!userOK){
            res.sendStatus(500);
          }
        }
      }
    });
});

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('server is up in port: ' + port);
