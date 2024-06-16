import { ClientEvents, User } from "@panda-chess/pdc-core";
import { databaseService } from "@panda-chess/pdc-microservices-agregator";
import { Socket } from "socket.io";

export const userDisconnect = async (user: User, socket: Socket) => {
    console.log("User disconnected: ", user);

    await databaseService.playerDoesNotWantToPlay(user._id!);

    await databaseService.updateUser({
        ...user,
        socketId: undefined
    });

    socket.broadcast.emit(ClientEvents.UserDisconnected, { user, status: "offline" });
};