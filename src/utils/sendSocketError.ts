import { Socket } from "socket.io";

export const sendSocketError = (socket: Socket, message: string) => {
    socket.emit("error", message);
};