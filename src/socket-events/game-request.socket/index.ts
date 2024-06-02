import { ServerGameRequestEvent } from "@panda-chess/pdc-core";
import { Socket } from "socket.io";
import { requestGame } from "./request-game.socket";

export const gameRequest = (socket: Socket): ServerGameRequestEvent => {
    return async (gameRequest) => {
        await requestGame(socket, gameRequest.initiator, gameRequest.receptor, gameRequest.gameType);
    };
};