import { ClientEvents, User } from "@panda-chess/pdc-core";
import { GameTypes } from "@panda-chess/pdc-core/dist/utils";
import { databaseService } from "@panda-chess/pdc-microservices-agregator";
import { Socket } from "socket.io";

export const requestGame = async (socket: Socket, initiator: User, receptor: User, gameType: GameTypes) => {
    const dbInitiator = await databaseService.getUserById(initiator._id!);
    const dbReceptor = await databaseService.getUserById(receptor._id!);

    if (gameType === GameTypes.casual) {
        socket.to(dbReceptor.socketId!).emit(ClientEvents.GameRequest, {
            initiator: dbInitiator,
            receptor: dbReceptor,
            gameType: GameTypes.casual
        });
    }

    if (gameType === GameTypes.competitive) {
        socket.to(dbReceptor.socketId!).emit(ClientEvents.GameRequest, {
            initiator: dbInitiator,
            receptor: dbReceptor,
            gameType: GameTypes.competitive
        });
    }
};