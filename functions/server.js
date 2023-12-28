import Express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";

const sockets = [];

const server = () => {
    const app = new Express();
    const server = createServer(app);
    const io = new Server(server);

    app.use(Express.static("public"));

    io.on("connection", (socket) => {
        console.log("A user connected");
        sockets.push(socket);
        socket.on("disconnect", () => {
            console.log("User disconnected");
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

