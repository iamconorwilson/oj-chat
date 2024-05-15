import Express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

let io, socketCount = 0;

const version = process.env.npm_package_version;
const port = process.env.PORT || 3000;

const server = () => {
    const app = new Express();
    const server = createServer(app);
    io = new Server(server);

    app.use(Express.static("public"));

    io.on("connection", (socket) => {

        //set sockets to total number of connected sockets
        socketCount = io.sockets.sockets.size;

        console.log(`A user connected. ${socketCount} users connected`);
        
        socket.emit("version", version);

        socket.on("disconnect", () => {
            socketCount = io.sockets.sockets.size;
            console.log(`A user disconnected. ${socketCount} users connected`);
        });

        socket.on("clientError", (data) => {
            console.error("Client error: ", JSON.stringify(data));
        });
    });

    server.listen(port, () => {
        console.log(`Listening on *:${port}`);
    });

}

const emit = (event, data) => {
    if (!io) return console.error("Socket not initialized");
    io.emit(event, data);
}


export { server, emit }

