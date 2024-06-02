import { ServerGameCreateEvent } from "@panda-chess/pdc-core";
import { Socket } from "socket.io";
import { casualGame as game } from "./game-create.socket";

export const casualGame = (socket: Socket): ServerGameCreateEvent => {
    return async (gameRequest) => {
        await game(socket, gameRequest.initiator, gameRequest.receptor, gameRequest.gameType);
    };
};