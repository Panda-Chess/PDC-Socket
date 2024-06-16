import { Server, Socket } from "socket.io";
import { authMiddleware } from "../middlewares/auth.middleware";
import { connection } from "./connection.socket/connection.socket";
import { createServer } from "http";
import { ServerConnectionEvent, ServerEvents } from "@panda-chess/pdc-core";

export const startServer = (serverPort: number) => {
    const httpServer = createServer();

    const io = new Server(httpServer, { path: "/socket", cors: { origin: "*" } });

    io.use(authMiddleware);

    const onConnection: ServerConnectionEvent = async (socket: Socket) => await connection(socket);

    io.on(ServerEvents.Connection, onConnection);

    io.listen(serverPort);

    return { httpServer, io };
};