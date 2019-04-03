// make socket connection
// this will fire the connection event we made on the server
var socket = io.connect("https://localhost:4001");

// Emit events to the server
$("#send").on("click",function(){
    // emit message using the socket to the server with 'chat' as the message name
    // and the second parameter is object that holds the message itself and the handle of the user who's writing it
    socket.emit("chat",{
        message:$("#message").val(),
        handle:$("#handle").val()
    });
});

$("#message").on("keypress",function () {
    // emit message using the socket to the server with 'typing' as the message name
    // so we can broadcast the typing div to the other users with handle name
    socket.emit("typing",$("#handle").val());
});

// Listen for events happend on the socket
socket.on("chat",function (data) {
    $("#feedback").html("");
    $("#output").append(`<p><strong>${data.handle}:</strong> ${data.message}</p>`);
});

socket.on("typing",function (data) {
    $("#feedback").html(`<p><em>${data} is typing a message ...</em></p>`);
});

