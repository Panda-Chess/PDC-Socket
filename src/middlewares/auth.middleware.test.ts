import { describe } from "@jest/globals";
import { io } from "socket.io-client";
import { createTestUser, deleteTestUser } from "../utils/tests/user.operations"
import { sign } from "jsonwebtoken";
import { ClientEvents } from "@panda-chess/pdc-core";

describe("Auth Middleware", () => {
    it("should return Authentication Error", (done) => {
        const mainTest = async () => {
            const socket = io("http://localhost:3005");

            socket.on(ClientEvents.ConnectError, (err: Error) => {
                expect(err.message).toBe("Authentication error");

                done();
            });
        }

        mainTest();
    });

    it("should connect", (done) => {
        createTestUser().then((testUser) => {
            const token = sign({ ID: testUser._id }, process.env.SECRET_KEY || "secret");
            const socket = io("http://localhost:3005", { auth: { token: token } });

            socket.on(ClientEvents.Connect, async () => {
                expect(socket.connected).toBe(true);

                socket.on(ClientEvents.Disconnect, async () => {
                    await deleteTestUser(testUser);
                    done();
                });

                socket.disconnect();
            });

        });
    });
});