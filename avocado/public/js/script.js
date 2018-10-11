window.onload = function()
{
  checkCookie(true);
}

function setCookie(cname, cvalue, expire) {
    var d = new Date();
    d.setTime(d.getTime() + expire);
    var expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function checkCookie(onload) {
    var loggedin = getCookie("uid");
    if (loggedin == "") {
        Logout(onload);
        if(onload == false){
          Logout(false);
        }
    } else {
      if(onload){
        getNewInboxItems();
      }
      document.getElementById("navbar").style.display = "";
      $("#navbar").load("navbar.html");
      setCookie("uid", loggedin, 60 * 60 * 1000);
    }
}

function getCookie(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for(var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
}

function registerfunc() {
    var username = document.getElementById("username").value.toLowerCase();
    var pass = document.getElementById("pass").value.toLowerCase();
    $.post('/register/' + username + '/' + pass, function(response){
        loginfunc();
    }).fail(function(err){
      if (err.readyState == 4 && err.status == 500) {
          alert("User already exist!");
      }
    });
}

function loginfunc() {
    var username = document.getElementById("username").value.toLowerCase();
    var pass = document.getElementById("pass").value.toLowerCase();
    $.post('/login/' + username + '/' + pass, function(res){
      document.getElementById("navbar").style.display = "";
      $("#navbar").load("navbar.html");
      document.getElementById("pageContent").innerHTML = "<div class=\"alert alert-success\"><strong><h1><u> Welcome " + username + "! </strong></u></h1>"
      setCookie("userName", username);
      getNewInboxItems();
    }).fail(function(err){
      if (err.readyState == 4 && err.status == 500) {
          alert("Wrong Password or UserName");
      }
    });
}

function Logout(onload) {
    document.getElementById("pageContent").style.height = window.outerHeight + "px";
    document.getElementById("navbar").style.display = "none";
    document.getElementById("navbar").innerHTML = " ";
    $("#pageContent").load("login.html");
    setCookie("uid", "", 60 * 60 * 1000);
    if(!onload){
      location.reload(false);
    }
}

function ChangePassword(){
  checkCookie(false);
  var username = document.getElementById("UserName").value.toLowerCase();
  var pass = document.getElementById("Password").value.toLowerCase();

  $.post('/changePassword/' + username + '/' + pass, function(res){
    alert("Password Changed");
  }).fail(function(err){
    if (err.readyState == 4 && err.status == 500) {
        alert("User doesn't exist!");
    }
  });
}

function setSecurity(){
  checkCookie(false);
  $.get('/security', function(res){
    if (res.readyState == 4 && res.status == 500) {
      alert("need to login again!")
      Logout(false);
    } else {
        console.log(res);
        if(res){
          document.getElementById("public").checked = true;
        }
        else{
          document.getElementById("private").checked = true;
        }
      }
    });
}

function UpdateSecurity(security){
  checkCookie(false);

  $.post('/updateSecurity/' + security, function(res){
    alert("updated Security");
  }).fail(function(err){
    if (err.readyState == 4 && err.status == 500) {
        alert("User doesn't exist!");
    }
  });
}

function addNewRecipe(){
  $("#pageContent").load("uploadRecipe.html", function(){
    onPageLoded();
  });
}

function getItems() {
  checkCookie(false);
  $.get('/items', function(res){
      console.log(res);
      if (res == "OK") {
        var table = document.getElementById("itemsTable");
        table.innerHTML = "<p> No Recipes </p>";

        table = document.getElementById("itemsTableByRate");
        table.innerHTML = "<p> No Recipes </p>";

        table = document.getElementById("MyRecipes");
        table.innerHTML = "<p> No Uploads </p>";
      }
      else{
        var Recipes = res;
        Recipes.sort(function(a, b){
          var newA = new Date(a.date).getTime();
          var newB = new Date(b.date).getTime();

          return newB - newA;
        });
        insertItemsToTable(Recipes, "itemsTable", 2, '');

        Recipes.sort(function(a, b){return b.views.length-a.views.length});
        insertItemsToTable(Recipes, "itemsTableByRate", 2, '');

        getMyItems(false);
      }
  }).fail(function(err){
    logout(false);
  });
}

function getMyItems(canEdit) {
    checkCookie(false);
    $.get('/myRecipes/' + getCookie("userId"), function(res){
      if (res == "OK") {
        var table = document.getElementById("MyRecipes");
        table.innerHTML = "<p>  No Uploads </p>";
      }
      else{
        var text = '';

        if(canEdit){
          text += '<button type="submit" onClick="deleteRecipe(this)" class="btn" style="color: black; float:right; display:inline-block; margin-left:2%; background-color: rgb(227,227,227);">delete</button>';
          text += '<button type="submit" onClick="editRecipe(this)" class="btn" style=" color: black; float:right; display:inline-block; background-color: rgb(227,227,227);">edit</button>';
        }
        insertItemsToTable(res, "MyRecipes", 2, text);
      }
    }).fail(function(err){
        Logout(false);
    });
}

function getNewInboxItems() {
    checkCookie(false);
    $.get('/HaveNewInbox', function(res){
      if (res.length > 0) {
        if (confirm("Someone shared with you a new recipe. \n Do you want go to your inbox?") == true) {
            goToInbox();
        }
      }
    }).fail(function(err){
        Logout(false);
    });
}

function goToInbox(){
  $("#pageContent").load("allRecipesFeed.html", function(){
    document.getElementById("pageHeader").innerHTML = "<u> INBOX: </u>";
    var table = document.getElementById("itemsTable");
    table.id = "InboxRecipes";
    getInboxItems();
  });
}

function getInboxItems() {
    checkCookie(false);
    $.get('/inbox', function(res){
      if (res.length > 0) {
        var text = '<button type="submit" onClick="deleteInboxRecipe(this)" class="btn" style="color: black; background-color: rgb(227,227,227);">delete</button> </div>';

        insertItemsToTable(res, "InboxRecipes", -1, text);
      }
      else{
        var table = document.getElementById("InboxRecipes");
        table.innerHTML = "<p> No Inbox Recipes </p>";
      }
    }).fail(function(err){
        Logout(false);
    });
}

function deleteInboxRecipe(recipeButton){
  var recipeID = recipeButton.parentNode.id;

  checkCookie(false);
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
          console.log("success delete Recipe from inbox");
          goToInbox();
      }
      if (this.readyState == 4 && this.status == 404) {
          alert("need to login again!")
          Logout(false);
      }
  };
  xhttp.open("DELETE", "/inboxRecipe/" + recipeID, true);
  xhttp.send();
}

function insertItemsToTable(items, tableName, amount, text){
  var tr = document.getElementById(tableName);
  var header = document.getElementById("Header" + tableName);

  if(header != null){
    var Style = header.style;
    tr.innerHTML = "<td id='" + header.id + "'> " + header.innerHTML + "</td>";
  }

  var length = amount;
  if(amount == -1 || amount >= items.length){
    length = items.length;
  }
  for (i = 0; i < length; i++) {
      var newItem = "";
      var obj = items[i];
      if(amount == -1 || tableName == "MyRecipes"){
        newItem += '<td class=recipeAllTableItem>'
      }
      else{
        newItem += '<td class=recipeTableItem>'
      }
      newItem += '<div id=' + obj.uuid + ' class="RecipeItem" style="float:left;">'
      newItem +=    '<img class="center-cropped" src="' + obj.data.img.data + '" style="float:left;">'
      newItem +=    '<div style="float:left; height: 150px;" onclick="getItem(\'' + obj.uuid + '\', false, -1)">'
      newItem +=        '<h3 id="RecipeName" style=" height: 50%; width: 9em; padding-left: 10px; padding-right: 10px; word-wrap: break-word; margin-top: 10px; color:rgb(152,152,152);">' + obj.data.RecipeName + '</h3>'
      newItem +=         '<h4 id="RecipeSummary" style="padding-left: 20px; padding-right: 20px; color:rgb(152,152,152);">' + obj.data.RecipeSummary + '</h4>'
      newItem +=         '<h4 id="RecipeRate" style="padding-left: 20px; padding-right: 20px; color:rgb(152,152,152);"> Views: ' + obj.views.length  + '</h4>'
      newItem +=    '</div>' + text
      newItem +=    '</div>'
      newItem +='</td>'
      tr.innerHTML += newItem;
  }

  if(length != 0 && amount != -1){
    tr.innerHTML += '<td class=more> <div> <button type="submit" onClick="ShowAllRecipes(\'' + tableName + '\')" class="btn" style="color: black; background-color: rgb(227,227,227);">More</button> </div> </td>'
  }
}

function ShowAllRecipes(tableName){
  console.log("show");
  checkCookie(false);
  $("#pageContent").load("allRecipesFeed.html", function(){
    var table = document.getElementById("itemsTable");
    if(tableName === "itemsTable"){
      document.getElementById("pageHeader").innerHTML = "<u> Newest Recipes </u>"
    }else if(tableName === "itemsTableByRate"){
      document.getElementById("pageHeader").innerHTML = "<u> Popular Recipes </u>"
    }else{
      document.getElementById("pageHeader").innerHTML = "<u> My Recipes </u>"
    }
    table.id = tableName;
    if(tableName == "MyRecipes"){
      $.get('/myRecipes/' + getCookie("userId"), function(res){
        if (res == "OK") {
          var table = document.getElementById("MyRecipes");
          table.innerHTML = "<p> No Recipes </p>";
        }
        else{
          var text = '<button type="submit" onClick="editRecipe(this)" class="btn" style=" padding-left: 20px; padding-right: 20px; color: black; background-color: rgb(227,227,227);">edit</button>';
          text += '<button type="submit" onClick="deleteRecipe(this)" class="btn" style="color: black; background-color: rgb(227,227,227);">delete</button>';

          insertItemsToTable(res, "MyRecipes", -1, text);
        }
      }).fail(function(err){
        Logout(false);
      });
    }
    else{
      $.get('/items', function(res){
          console.log(res);
          if (res == "OK") {
            table.innerHTML = "<p> No Recipes </p>";
          }
          else {
            var Recipes = res;
            if(tableName == "itemsTable"){
              Recipes.sort(function(a, b){
                var newA = new Date(a.date).getTime();
                var newB = new Date(b.date).getTime();

                return newB - newA;
              });
              insertItemsToTable(Recipes, "itemsTable", -1, '');
            }
            else{
              Recipes.sort(function(a, b){return b.views.length-a.views.length});
              insertItemsToTable(Recipes, "itemsTableByRate", -1, '');
            }
          }
      }).fail(function(err){
        Logout(false);
      });
    }

  });
}

function search() {
  $("#pageContent").load("allRecipesFeed.html", function(){
    var input, searchInput, table;
    input = document.getElementById("searchInput");
    searchInput = input.value.toUpperCase();
    table = document.getElementById("itemsTable");

    $.get('/items', function(res){
        if (res == "OK") {
          table.innerHTML = "<p> No Recipes </p>";
        }
        else {
          var Recipes = res;
          var newRecipes = [];
          for (i = 0; i < Recipes.length; i++) {
            var obj = Recipes[i];
            if(Recipes[i].data.RecipeName.toUpperCase().indexOf(searchInput) > -1){
              newRecipes.push(Recipes[i]);
            }
          }
            insertItemsToTable(newRecipes, "itemsTable", -1, '');
        }
    }).fail(function(err){
      Logout(false);
    });
  });
}

function postItem() {
  checkCookie(false);
  var img = {};
  var file = document.getElementById("imgInp").files[0];

  img.data = document.getElementById("imagePreview").src;
  img.name = file.name;

  var myObj = {};
  var RecipeName = document.getElementById("RecipeName").value;
  myObj.userId = getCookie("userId");
  myObj.RecipeName = RecipeName;
  myObj.RecipeSummary = document.getElementById("RecipeSummery").value;
  myObj.img = img;
  myObj.ingredients = [];
  var ingredients = document.getElementsByClassName("ingredient");

  for(var i=0; i < ingredients.length; i++) {
    var ingredient = {};
    ingredient.Amount = ingredients[i].children.Amount.value;
    if(ingredient.Amount === "") {
      ingredient.Amount = ingredients[i].children.Amount.placeholder;
    }
    ingredient.tool = ingredients[i].children.tool.value;
    if(ingredient.tool === "") {
      ingredient.tool = ingredients[i].children.tool.placeholder;
    }
    ingredient.ingredient = ingredients[i].children.ingredient.value;
    if(ingredient.ingredient === "") {
      ingredient.ingredient = ingredients[i].children.ingredient.placeholder;
    }
    myObj.ingredients[i] = ingredient;
  }
  myObj.makes = document.getElementById("makes").value;
  myObj.instructions = document.getElementById("instructions").value;

  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
          document.getElementById("pageContent").innerHTML = "<div class=\"alert alert-success\"><strong><h1><u> Success post new recipe " + RecipeName + "! </strong></u></h1>"
      }
  };
  xhttp.open("POST", "/item", true);
  xhttp.setRequestHeader("Content-type", "application/json");
  xhttp.send(JSON.stringify(myObj));
}

function getItem(id, needToEdit, serving) {
    checkCookie(false);
    $.get('/item/' + id , function(res){
      if (res.readyState == 4 && res.status == 500) {
        alert("need to login again!")
        Logout(false);
      } else {
          if(needToEdit){
            editItemPage(res);
          }
          else{
            goToItemPage(res, id, serving);
          }
        }
    });
};

function editRecipe(recipeButton){
  var recipeID = recipeButton.parentNode.id;
  getItem(recipeID, true, -1);
}

function goToItemPage(item, id, serving){
    checkCookie(false);
      $("#pageContent").load("RecipeItem.html", function(){
        document.getElementById("RecipeName").innerHTML = "<u>" +item.data.RecipeName + "</u>";
        $('#imagePreview').attr('src', item.data.img.data);

        var changeAmountBy = 1;
        if(serving != -1){
           changeAmountBy = serving / item.data.makes;
        }

        for(var i=0; i < item.data.ingredients.length; i++) {
      	  var ingredient = item.data.ingredients[i];
          var x = '';
          x += '<div class="ingredient" id="first">';
          x += '<p> ' + (ingredient.Amount * changeAmountBy) + " " + ingredient.tool + ' of ' + ingredient.ingredient + '</p>';
          x += '</div>';
          document.getElementById("ingredients").innerHTML += x;
        }
        document.getElementById("RecipeId").innerHTML = id;

        document.getElementById("Needed").value = changeAmountBy * item.data.makes;
        document.getElementById("makes").value = changeAmountBy * item.data.makes;

        document.getElementById("makes").innerHTML = "<u>Makes:	</u>" + changeAmountBy * item.data.makes + " Serving";

        document.getElementById("instructions").innerHTML = item.data.instructions.replace(/\n/g, "<br>");

    });
}

function ChangeAmount(serving){
  var id = document.getElementById("RecipeId").innerHTML;
  getItem(id, false , serving);
}

function editItemPage(item){
    checkCookie(false);
    console.log(item);
      $("#pageContent").load("editRecipe.html", function(){
        $('#imagePreview').attr('src', item.data.img.data);
        document.getElementById("RecipeName").value = item.data.RecipeName;
        document.getElementById("RecipeSummery").value = item.data.RecipeSummary;
        for(var i=0; i < item.data.ingredients.length; i++) {
      	  var ingredient = item.data.ingredients[i];
          var x = '';
          x += '<div class="ingredient">';
          x += '<input type="number" id="Amount" value="' + ingredient.Amount + '" style="margin-right: 4px;" placeholder ="'+ ingredient.Amount + '">';
          x +=  '<input id="tool" list="toolData" name="tool" style="width: 30%; margin-right: 4px;" value="' + ingredient.tool + '" placeholder ="'+ ingredient.tool + '"><datalist id="toolData"><option value="cup"><option value="teaspoons"><option value="tablespoons">' +
                '<option value="oz"><option value="gram"><option value="kilogram"><option value="pound"><option value="ounce"></datalist>';
          x += '<input type="text" id="ingredient" value="' + ingredient.ingredient  + '" style="width: 50%; margin-right: 4px;" placeholder ="'+ ingredient.ingredient + '">';
          x += ' <a onClick="deleteIngredient(this.parentNode.parentNode)"  style="width: 1%; color: black;">x </a> </div>';
          document.getElementById("ingredients").innerHTML += x;
        }
        document.getElementById("makes").value = item.data.makes;

        document.getElementById("instructions").value = item.data.instructions;
        $('#updateButton').attr('onclick', "updateRecipe('" + item.uuid + "')");
    });
}

function ShareWith(user){
  checkCookie(false);
  var RecipeId = document.getElementById("RecipeId").innerHTML;
  $.post('/ShareWith/' + user.toLowerCase() + '/' + RecipeId, function(res){
      alert(res);
  }).fail(function(err){
    console.log(err);
    if (err.readyState == 4 && err.status == 500) {
      alert("need to login again!")
      Logout(false);
    }
  });
}


function deleteRecipe(recipeButton){
  var recipeID = recipeButton.parentNode.id;
  checkCookie(false);
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
          console.log("success delete user Recipe");
          document.getElementById("MyRecipes").innerHTML = "";
          getMyItems(true);
      }
      if (this.readyState == 4 && this.status == 404) {
          alert("need to login again!")
          Logout(false);
      }
  };
  xhttp.open("DELETE", "/item/"  + recipeID, true);
  xhttp.send();
}

function deleteUserRecipes() {
  checkCookie(false);
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
          document.getElementById("MyRecipes").innerHTML = "";
          getMyItems(true);
          console.log("success delete user Recipes");
      }
      if (this.readyState == 4 && this.status == 404) {
          alert("need to login again!")
          Logout(false);
      }
  };
  xhttp.open("DELETE", "/items/"  + getCookie("userId"), true);
  xhttp.send();
}

function deleteUser() {
  checkCookie(false);
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
          Logout(false);
      }
      if (this.readyState == 4 && this.status == 404) {
          alert("need to login again!")
          Logout(false);
      }
  };
  xhttp.open("DELETE", "/deleteUser", true);
  xhttp.send();
}

function deleteItem(id) {
  checkCookie(false);
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
          getItems();
      }
      if (this.readyState == 4 && this.status == 404) {
          alert("need to login again!")
          Logout(false);
      }
  };
  xhttp.open("DELETE", "/item/" + id, true);
  xhttp.send();
}

function updateRecipe(RecipeId) {
  checkCookie(false);
  var img = {};
  var file = document.getElementById("imgInp").files[0];

  img.data = document.getElementById("imagePreview").src;
  img.name = img.name;

  var myObj = {};
  var RecipeName = document.getElementById("RecipeName").value;
  myObj.userId = getCookie("userId");
  myObj.RecipeName = RecipeName;
  myObj.RecipeSummary = document.getElementById("RecipeSummery").value;
  myObj.img = img;
  myObj.ingredients = [];
  var ingredients = document.getElementsByClassName("ingredient");

  for(var i=0; i < ingredients.length; i++) {
    var ingredient = {};
    ingredient.Amount = ingredients[i].children.Amount.value;
    if(ingredient.Amount === "") {
      ingredient.Amount = ingredients[i].children.Amount.placeholder;
    }
    ingredient.tool = ingredients[i].children.tool.value;
    if(ingredient.tool === "") {
      ingredient.tool = ingredients[i].children.tool.placeholder;
    }
    ingredient.ingredient = ingredients[i].children.ingredient.value;
    if(ingredient.ingredient === "") {
      ingredient.ingredient = ingredients[i].children.ingredient.placeholder;
    }
    myObj.ingredients[i] = ingredient;
  }
  myObj.makes = document.getElementById("makes").value;
  myObj.instructions = document.getElementById("instructions").value;
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
        document.getElementById("pageContent").innerHTML = "<div class=\"alert alert-success\"><strong><h1><u> Success update recipe " + RecipeName + "! </strong></u></h1>"
      }
  };
  xhttp.open("PUT", "/item/" + RecipeId, true);
  xhttp.setRequestHeader("Content-type", "application/json");
  xhttp.send(JSON.stringify(myObj));
}

function resize(){
  document.getElementById("pageContent").style.height = (window.innerHeight - document.getElementById("navbar").style.height) + "px";
  document.getElementById("pageContent").style.width = window.innerWidth + "px";
  console.log("change size");
}

function addIngredient(){
  var node = document.createElement("div");
  node.class = ingredient;
  console.log(node.class);
  node.innerHTML = '<div class="ingredient"> <input type="number" id="Amount" placeholder ="1" style="width: 10%; margin-right: 4px;">' +
  '<input id="tool" list="toolData" name="tool" style="width: 30%; margin-right: 4px;" placeholder ="cup"><datalist id="toolData"><option value="cup"><option value="teaspoons"><option value="tablespoons">' +
  '<option value="oz"><option value="gram"><option value="kilogram"><option value="pound"><option value="ounce"></datalist>' +
  '<input type="text" id="ingredient" placeholder="ingredient" style="width: 50%; margin-right: 4px;"> <a onClick="deleteIngredient(this.parentNode.parentNode)"  style="width: 1%; color: black;">x </a> </div>';
  document.getElementById("ingredients").appendChild(node);
}

function deleteIngredient(nodeToRemove){
  document.getElementById("ingredients").removeChild(nodeToRemove);
}

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}


window.readURL = function(url){
    // Read in file
    var file = event.target.files[0];

    // Ensure it's an image
    if(file.type.match(/image.*/)) {
        console.log('An image has been loaded');

        // Load the image
        var reader = new FileReader();
        reader.onload = function (readerEvent) {
            var image = new Image();
            image.onload = function (imageEvent) {

                // Resize the image
                var canvas = document.createElement('canvas'),
                    max_size = 512,
                    width = image.width,
                    height = image.height;
                if (width > height) {
                    if (width > max_size) {
                        height *= max_size / width;
                        width = max_size;
                    }
                } else {
                    if (height > max_size) {
                        width *= max_size / height;
                        height = max_size;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(image, 0, 0, width, height);
                var dataUrl = canvas.toDataURL('image/jpeg');
                $('#imagePreview').attr('src', dataUrl);
            }

            image.src = readerEvent.target.result;
        }
        reader.readAsDataURL(file);
    }
};

var dataURLToBlob = function(dataURL) {
    var BASE64_MARKER = ';base64,';
    if (dataURL.indexOf(BASE64_MARKER) == -1) {
        var parts = dataURL.split(',');
        var contentType = parts[0].split(':')[1];
        var raw = parts[1];

        return new Blob([raw], {type: contentType});
    }

    var parts = dataURL.split(BASE64_MARKER);
    var contentType = parts[0].split(':')[1];
    var raw = window.atob(parts[1]);
    var rawLength = raw.length;

    var uInt8Array = new Uint8Array(rawLength);

    for (var i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], {type: contentType});
}
