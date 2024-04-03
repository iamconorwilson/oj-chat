import Express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

let io, sockets;

const version = process.env.npm_package_version;

const server = () => {
    const app = new Express();
    const server = createServer(app);
    io = new Server(server);

    app.use(Express.static("public"));

    io.on("connection", (socket) => {

        //set sockets to total number of connected sockets
        sockets = io.sockets.sockets.size;

        console.log(`A user connected. ${sockets} users connected`);
        
        socket.emit("version", version);

        socket.on("disconnect", () => {
            sockets = io.sockets.sockets.size;
            console.log(`A user disconnected. ${sockets} users connected`);
        });

        socket.on("clientError", (data) => {
            console.error("Client error: ", JSON.stringify(data));
        });
    });

    server.listen(3000, () => {
        console.log("Listening on *:3000");
    });

}

const emit = (event, data) => {
    if (!io) return console.error("Socket not initialized");
    io.emit(event, data);
}


export { server, emit }

