import { describe } from "@jest/globals";
import { io } from "socket.io-client";
import { createTestUser, deleteTestUser } from "../../utils/tests/user.operations"
import { sign } from "jsonwebtoken";
import { ClientEvents, User } from "@panda-chess/pdc-core";
import { databaseService } from "@panda-chess/pdc-microservices-agregator";
import { WantsToPlay } from "@panda-chess/pdc-core/dist/utils";

describe("Connection Behaveior", () => {
    test("should notify user1 connection", (done) => {
        const mainTest = async () => {
            const testUser1 = await createTestUser();

            const token1 = sign({ ID: testUser1._id }, process.env.SECRER_KEY || "secret");
            const socket1 = io("http://localhost:3001", { auth: { token: token1 } });

            socket1.on(ClientEvents.Connect, () => {
                socket1.on(ClientEvents.ConnectedUsers, async (users: WantsToPlay[]) => {
                    expect(users.length).toBeGreaterThanOrEqual(1);

                    socket1.on(ClientEvents.Disconnect, async () => {
                        await deleteTestUser(testUser1);
                        done();
                    });

                    socket1.disconnect();
                });
            });
        };

        mainTest();
    });

    test("should notify user2 connection", (done) => {
        const mainTest = async () => {
            const testUser1 = await createTestUser();
            const testUser2 = await createTestUser();

            const token1 = sign({ ID: testUser1._id }, process.env.SECRER_KEY || "secret");
            const socket1 = io("http://localhost:3001", { auth: { token: token1 } });

            socket1.on(ClientEvents.UserConnected, async (user: WantsToPlay) => {
                expect(user.user._id).toBe(testUser2._id);

                socket1.on(ClientEvents.Disconnect, async () => {
                    await deleteTestUser(testUser1);
                    await deleteTestUser(testUser2);
                    done();
                });

                socket1.disconnect();
            });

            const token2 = sign({ ID: testUser2._id }, process.env.SECRER_KEY || "secret");
            const socket2 = io("http://localhost:3001", { auth: { token: token2 } });
        };

        mainTest();
    });

    test("should notify user2 disconnection", (done) => {
        const mainTest = async () => {
            const testUser1 = await createTestUser();
            const testUser2 = await createTestUser();

            const token1 = sign({ ID: testUser1._id }, process.env.SECRER_KEY || "secret");
            const socket1 = io("http://localhost:3001", { auth: { token: token1 } });

            const token2 = sign({ ID: testUser2._id }, process.env.SECRER_KEY || "secret");
            const socket2 = io("http://localhost:3001", { auth: { token: token2 } });

            socket1.on(ClientEvents.UserConnected, async (user: WantsToPlay) => {
                expect(user.user._id).toBe(testUser2._id);

                socket1.on(ClientEvents.Disconnect, async () => {
                    await deleteTestUser(testUser1);
                    await deleteTestUser(testUser2);
                    done();
                });

                socket1.disconnect();
            });

            socket2.on(ClientEvents.Connect, () => {
                socket2.disconnect();
            });
        };

        mainTest();
    });

    test("should change connection status", (done) => {
        const mainTest = async () => {
            const testUser1 = await createTestUser();
            const testUser2 = await createTestUser();

            const token1 = sign({ ID: testUser1._id }, process.env.SECRER_KEY || "secret");
            const socket1 = io("http://localhost:3001", { auth: { token: token1 } });

            const token2 = sign({ ID: testUser2._id }, process.env.SECRER_KEY || "secret");
            const socket2 = io("http://localhost:3001", { auth: { token: token2 } });

            socket1.on(ClientEvents.Connect, async () => {
                wantsToPlay = await databaseService.getPlayersWhoWantToPlay();
                expect(wantsToPlay.find(player => player.user._id === testUser1._id)).toBeDefined();

                socket1.disconnect();
            });

            socket2.on(ClientEvents.UserDisconnected, async (newUser) => {
                wantsToPlay = await databaseService.getPlayersWhoWantToPlay();
                expect(wantsToPlay.find(player => player.user._id === testUser1._id)).toBeUndefined();

                socket2.disconnect();
            });

            let wantsToPlay = await databaseService.getPlayersWhoWantToPlay();
            expect(wantsToPlay.find(player => player.user._id === testUser1._id)).toBeUndefined();

            socket2.on(ClientEvents.Disconnect, async () => {
                await deleteTestUser(testUser1);
                await deleteTestUser(testUser2);
                done();
            });
        };

        mainTest();
    });
});