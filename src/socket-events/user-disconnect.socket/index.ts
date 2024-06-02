import { ServerDisconnectEvent, User } from "@panda-chess/pdc-core";
import { Socket } from "socket.io";
import { userDisconnect as disconnect } from "./user-disconnect.socket";

export const userDisconnect = (user: User, socket: Socket): ServerDisconnectEvent => {
    return async () => {
        await disconnect(user, socket);
    };
};