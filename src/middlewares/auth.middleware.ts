import { JwtPayload, verify } from "jsonwebtoken";
import { Socket } from "socket.io";
import { ExtendedError } from "socket.io/dist/namespace";

export const authMiddleware = (socket: Socket, next: (err?: ExtendedError | undefined) => void) => {
    const auth = socket.handshake.auth;
    if (auth && auth.token) {
        try {
            const decoded = (verify(auth.token, process.env.SECRET_KEY || "secret") as JwtPayload);
            socket.handshake.auth["user"] = decoded.ID;
            if (decoded) {
                return next();
            }
        } catch (error) {
            return next(new Error("Authentication error"));
        }
    }
    else {
        return next(new Error("Authentication error"));
    }

    next();
};