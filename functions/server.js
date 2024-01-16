import Express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const sockets = [];

const version = process.env.npm_package_version;

const server = () => {
    const app = new Express();
    const server = createServer(app);
    const io = new Server(server);

    app.use(Express.static("public"));

    io.on("connection", (socket) => {
        sockets.push(socket);
        
        console.log(`A user connected. ${sockets.length} users connected`);
        
        socket.emit("version", version)

        socket.on("disconnect", () => {
            const index = sockets.indexOf(socket);
            if (index !== -1) {
                sockets.splice(index, 1);
            }
            
            console.log(`A user disconnected. ${sockets.length} users connected`);
        });

        socket.on("clientError", (data) => {
            console.error(JSON.stringify(data));
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

