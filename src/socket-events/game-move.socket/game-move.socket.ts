import { Move, User } from "@panda-chess/pdc-core";
import { GameTypes } from "@panda-chess/pdc-core/dist/utils";
import { analyseService, databaseService, validatorService } from "@panda-chess/pdc-microservices-agregator";
import { Socket } from "socket.io";

export const gameMove = async (socket: Socket, initiator: User, receptor: User, move: Move) => {
    const game = await databaseService.getGameByUsers(initiator._id!, receptor._id!);

    if (game?.gameType === GameTypes.competitive) {
        await analyseService.analyseMove(game._id!, move);
    }

    if (!game)
        return;

    await validatorService.validateMove(game._id!, move);

    socket.to(game.users.find(gameUser => gameUser.user._id !== socket.handshake.auth["user"])!.user.socketId!).emit("move", move);
};