import { ServerMoveEvent, User } from "@panda-chess/pdc-core";
import { gameMove as game } from "./game-move.socket";
import { Socket } from "socket.io";

export const gameMove = (socket: Socket, initiator: User, receptor: User): ServerMoveEvent => {
    return async (move) => {
        await game(socket, initiator, receptor, move);
    };
};