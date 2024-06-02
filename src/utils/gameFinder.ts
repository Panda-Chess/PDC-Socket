import { User, generatePieceSet } from "@panda-chess/pdc-core";
import { UserStatus } from "@panda-chess/pdc-core";
import { databaseService } from "@panda-chess/pdc-microservices-agregator";
import { Socket } from "socket.io";

export const findGame = async (socket: Socket, user: User, gameType: "casual" | "competitive") => {
    if(!user._id)
        return;

    const game = await databaseService.getGameByUser(user._id);
    if(game && game.gameType === gameType){
        return await databaseService.modifyGame({
            ...game,
            users: game.users.map(gameUser => {
                if(gameUser.user._id === user._id) {
                    return {
                        ...gameUser,
                        socketId: socket.id,
                        status: UserStatus.online
                    };
                }
                return gameUser;
            })
        });
    }

    const games = await databaseService.getUnstartedGames(gameType);

    if(games.length === 0) {
        await databaseService.createGame({
            gamePieces: generatePieceSet(),
            gameType: gameType,
            users: [{
                socketId: socket.id,
                color: "white",
                gamePoints: 0,
                user: user,
                status: UserStatus.waiting
            }],
            currentColor: "white"
        });
    }
    else {
        const game = games[0];
        const modifiedGame = await databaseService.modifyGame({
            ...game,
            users: [
                {
                    ...game.users[0],
                    status: UserStatus.online
                },
                {
                    socketId: socket.id,
                    color: "black",
                    gamePoints: 0,
                    user: user,
                    status: UserStatus.online
                }
            ]
        });    

        return modifiedGame;
    }
};