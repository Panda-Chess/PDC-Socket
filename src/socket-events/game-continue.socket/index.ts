import { ServerGameContinueEvent } from "@panda-chess/pdc-core";
import { gameContinue as game } from "./game-continue.socket";
import { Socket } from "socket.io";

export const gameContinue = (socket: Socket): ServerGameContinueEvent => {
    return async (gameRequestDTO) => {
        await game(socket, gameRequestDTO);
    };
};