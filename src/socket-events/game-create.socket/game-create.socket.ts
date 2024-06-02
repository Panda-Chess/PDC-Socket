import { Socket } from "socket.io";
import { databaseService } from "@panda-chess/pdc-microservices-agregator";
import {
    ClientEvents, GameRequestDto, UserStatus, generatePieceSet
} from "@panda-chess/pdc-core";
import { GameTypes, User } from "@panda-chess/pdc-core/dist/utils";

export const casualGame = async (socket: Socket, initiator: User, receptor: User, gameType: GameTypes) => {
    await databaseService.createGame({
        users: [
            {
                user: initiator,
                color: "white",
                gamePoints: 0,
                status: UserStatus.online
            },
            {
                user: receptor,
                color: "black",
                gamePoints: 0,
                status: UserStatus.online
            }
        ],
        gamePieces: generatePieceSet(),
        gameType: gameType,
        currentColor: "white",

    });

    const gameRequestDTO: GameRequestDto = {
        initiator,
        receptor,
        gameType: gameType
    };

    if (initiator.socketId === socket.id) {
        socket.to(receptor.socketId!).emit(ClientEvents.GameCreated, gameRequestDTO);
    } else {
        socket.to(initiator.socketId!).emit(ClientEvents.GameCreated, gameRequestDTO);
    }

    socket.emit(ClientEvents.GameCreated, gameRequestDTO);
};