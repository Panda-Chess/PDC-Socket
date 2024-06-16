import { Socket } from "socket.io";
import { databaseService } from "@panda-chess/pdc-microservices-agregator";
import { ClientEvents, GameRequestDto, ServerEvents } from "@panda-chess/pdc-core";
import { userDisconnect } from "../user-disconnect.socket";
import { gameRequest } from "../game-request.socket";
import { casualGame } from "../game-create.socket";
import { GameTypes } from "@panda-chess/pdc-core/dist/utils";
import { gameContinue } from "../game-continue.socket";

export const connection = async (socket: Socket) => {
    console.log("Socket connected: ", socket.id);

    const userPromise = databaseService.getUserById(socket.handshake.auth["user"]);

    socket.on(ServerEvents.Disconnect, userDisconnect(await userPromise, socket));

    socket.on(ServerEvents.GameRequest, gameRequest(socket));
    socket.on(ServerEvents.GameCreate, casualGame(socket));

    socket.on(ServerEvents.GameContinue, gameContinue(socket));

    await databaseService.updateUser({
        ...(await userPromise),
        socketId: socket.id
    });

    const currentUser = await databaseService.playerWantsToPlay({
        user: await userPromise,
        gameType: GameTypes.casual
    });
    const wantsToPlayCasual = (await databaseService.getPlayersWhoWantToPlay())
        .filter(player => player.gameType === GameTypes.casual);

    const currentMatch = await databaseService.getGameByUsers(socket.handshake.auth["user"]);

    if (currentMatch) {
        const gameRequest: GameRequestDto = {
            initiator: currentMatch.users[0].user,
            receptor: currentMatch.users[1].user,
            gameType: currentMatch.gameType
        };

        socket.emit(ClientEvents.GameContinueRequest, gameRequest);
    }

    socket.emit(ClientEvents.ConnectedUsers, wantsToPlayCasual);
    socket.broadcast.emit(ClientEvents.UserConnected, currentUser);
};