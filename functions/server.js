import Express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

import { version } from "../package.json";

const sockets = [];

const server = () => {
    const app = new Express();
    const server = createServer(app);
    const io = new Server(server);

    app.use(Express.static("public"));

    io.on("connection", (socket) => {
        console.log("A user connected");
        sockets.push(socket);
        socket.emit("version", version)
        socket.on("disconnect", () => {
            console.log("User disconnected");
            sockets.splice(sockets.indexOf(socket), 1);
        });
    });

    server.listen(3000, () => {
        console.log("Listening on *:3000");
    });
}

const emit = (event, data) => {
    sockets.forEach(socket => {
        socket.emit(event, data);
    });
}


export { server, emit }

