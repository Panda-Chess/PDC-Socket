import { ServerDisconnectEvent } from "@panda-chess/pdc-core";
import { disconnect } from "./game-disconnect.socket";
import { Socket } from "socket.io";

export const gameDisconnect = (socket: Socket): ServerDisconnectEvent => {
    return async () => {
        await disconnect(socket);
    };
};