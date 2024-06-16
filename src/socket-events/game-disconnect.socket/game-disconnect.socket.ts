import { ClientEvents } from "@panda-chess/pdc-core";
import { UserStatus } from "@panda-chess/pdc-core";
import { databaseService } from "@panda-chess/pdc-microservices-agregator";
import { Socket } from "socket.io";

export const disconnect = async (socket: Socket) => {
    console.log("Socket disconnected: ", socket.id);

    const userId = socket.handshake.auth["user"];

    const game = await databaseService.getGameByUsers(userId);

    if (!game) {
        return;
    }

    if (game.users.some(gameUser => gameUser.status === UserStatus.offline)) {
        await databaseService.deleteGame(game._id!);
    }
    else {
        await databaseService.modifyGame({
            ...game,
            users: game.users.map(gameUser => {
                if (gameUser.user._id === userId) {
                    return {
                        ...gameUser,
                        status: UserStatus.offline
                    };
                }
                return gameUser;
            })
        });

    }
    const socketToSend = game.users.find(gameUser => gameUser.user._id !== userId)!.user.socketId!;

    socket.to(socketToSend).emit(ClientEvents.OpponentDisconnect);
};