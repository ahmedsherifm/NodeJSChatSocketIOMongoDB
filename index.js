// requirng modules
var express = require("express");
var socket = require("socket.io");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var path = require("path");

// app setup
var app = express();

var port = process.env.PORT || 4001;
var host = process.env.HOST || "localhost";

// initiate server
var server = app.listen(port, function () {
    console.log(`Listening at http://${host}:${port}`);
});

// use static files in public folder
app.use(express.static("public"));

// use body parser middleware
app.use(bodyParser.urlencoded({
    extended: true
}));

// use ejs template
app.set("view engine", "ejs");
app.set("views", "templates");
app.set('views', path.join(__dirname, "views"));

var dbusername = "foreverdontcare";
var dbpassword = encodeURIComponent("User61559925#$");
// connect to mongodb and create chat db if it doesn't exists
mongoose.connect(`mongodb+srv://${dbusername}:${dbpassword}@chat-qoelz.mongodb.net/test?retryWrites=true`, {
    useNewUrlParser: true
});

var chatSchema = mongoose.Schema;

var userSchema = new chatSchema({
    Handle: String,
    Password: String
});

var User = mongoose.model("user", userSchema);
var db = mongoose.connection;

// console.log(db);

db.on("error", function (err) {
    console.log(err);

});

db.once("open", function () {
    console.log("DB Connected");

    app.get("/", (req, res) => {
        res.render("Login",{Error:""});
    });

    app.get("/Login", (req, res) => {
        res.render("Login",{Error:""});
    });

    app.get("/Register", (req, res) => {
        res.render("Register",{Error:""});
    });

    app.post("/Register", (req, res) => {
        var formData = req.body;
        var newUser = User({
            Handle: formData.handle,
            Password: formData.password
        });

        // check if the user already exists so we don't register new one
        User.count({
            Handle: formData.handle
        }, function (err, count) {
            // if already exists we return an Error message to the user else register the user and redirect him to the chat room
            if (count > 0) {
                res.render("Register", {
                    Error: `this ${formData.handle} already exists`
                });
            } 
            else {
                newUser.save((err) => {
                    if (err) throw err;

                    console.log("Person Saved !");
                });

                // res.redirect("/ChatRoom");
                res.render("ChatRoom", {
                    Handle: formData.handle
                });
            }
        });

    });

    app.post("/Login", function (req, res) {
        var formData = req.body;
        // here I used count to check if the entered user is in the system
        User.count({
            Handle: formData.handle,
            Password: formData.password
        }, function (err, count) {
            if (count > 0) {
                // res.redirect("/ChatRoom");
                res.render("ChatRoom", {
                    Handle: formData.handle
                });
            } else {
                res.render("Login", {
                    Error: "Invalid Handle / Password pair"
                });
            }
        });
    });

    // socket setup
    // socket requires a server as parameter,
    // for that we registered the app.listen into server variable so we can use it here
    var io = socket(server);

    // listening to any socket connection happens to the server from the client side
    io.on("connection", function (socket) {
        // log the connection with client socket connection id , {changes with every refresh}
        console.log(`Made Socket Connection ${socket.id}`);

        // here we need to listen to the message sent by the client using the socket
        // and reseve the object from the server in the parameter of the callback function
        socket.on("chat", function (data) {
            // io.sockets referes to all the sockets connected to the server
            // so we emit the chat message to all the clients again
            // and when receving the data we can put it on the screen to all the users
            io.sockets.emit("chat", data);
        });

        // Handle typing event so it looks cool using broadcast
        socket.on("typing", function (data) {
            // socket.broadcast send the data on the emitted event to all other users
            // so we emit the typing message
            // and when receving the data we can put it on the screen to the other users
            socket.broadcast.emit("typing", data);
        });
    });

});