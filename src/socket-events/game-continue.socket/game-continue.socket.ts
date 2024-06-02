import {
    ClientEvents, GameRequestDto, ServerEvents, UserStatus 
} from "@panda-chess/pdc-core";
import { databaseService } from "@panda-chess/pdc-microservices-agregator";
import { Socket } from "socket.io";
import { gameDisconnect } from "../game-disconnect.socket";
import { gameMove } from "../game-move.socket";

export const gameContinue = async (socket: Socket, gameRequest: GameRequestDto) => {
    const currentMatch = await databaseService.getGameByUsers(gameRequest.initiator._id!, gameRequest.receptor._id!);

    if (!currentMatch)
        return;

    await databaseService.modifyGame({
        ...currentMatch,
        users: [
            {
                ...currentMatch.users[0],
                status: UserStatus.online
            },
            {
                ...currentMatch.users[1],
                status: UserStatus.online
            }
        ]
    });

    if (gameRequest.initiator._id === socket.handshake.auth["user"]) {
        socket.to(gameRequest.receptor.socketId!).emit(ClientEvents.GameContinue, currentMatch);
    } else {
        socket.to(gameRequest.initiator.socketId!).emit(ClientEvents.GameContinue, currentMatch);
    }

    socket.emit(ClientEvents.GameContinue, currentMatch);

    socket.on(ServerEvents.Disconnect, gameDisconnect(socket));
    socket.on(ServerEvents.Move, gameMove(socket, gameRequest.initiator, gameRequest.receptor));
};