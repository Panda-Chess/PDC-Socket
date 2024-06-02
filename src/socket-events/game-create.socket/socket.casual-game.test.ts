import { describe } from "@jest/globals";
import { io } from "socket.io-client";
import { createTestUser, deleteTestUser } from "../../utils/tests/user.operations"
import { sign } from "jsonwebtoken";
import { databaseService } from "@panda-chess/pdc-microservices-agregator";
import { sleep } from "../../utils/tests/sleep";
import { ClientEvents, ClientGameRequestEvent, GameRequestDto, ServerEvents, ServerGameRequestEvent } from "@panda-chess/pdc-core";
import { Game, GameTypes } from "@panda-chess/pdc-core/dist/utils";

describe("Casual Game", () => {
    test("should create a game", (done) => {
        const mainTest = async () => {
            const testUser1 = await createTestUser();
            const testUser2 = await createTestUser();

            const token1 = sign({ ID: testUser1._id }, process.env.SECRER_KEY || "secret");
            const socket1 = io("http://localhost:3001", { auth: { token: token1 } });

            const token2 = sign({ ID: testUser2._id }, process.env.SECRER_KEY || "secret");
            const socket2 = io("http://localhost:3001", { auth: { token: token2 } });

            socket1.on(ClientEvents.Connect, () => {
                const gameRequest: GameRequestDto = {
                    initiator: testUser1,
                    receptor: testUser2,
                    gameType: GameTypes.casual
                };

                socket1.emit(ServerEvents.GameRequest, gameRequest);
            });

            socket2.on(ClientEvents.GameRequest, (async (gameRequestDto) => {
                socket2.emit(ServerEvents.GameCreate, gameRequestDto);

                socket2.on(ClientEvents.GameCreated, async (game: GameRequestDto) => {
                    const currentGame = await databaseService.getGameByUsers(testUser1._id!, testUser2._id!);
                    expect(currentGame).toBeDefined();

                    await databaseService.deleteGame(currentGame!._id!);

                    socket1.disconnect();
                });
            }) as ClientGameRequestEvent);

            socket1.on(ClientEvents.Disconnect, async () => {
                await deleteTestUser(testUser1);
                socket2.disconnect();
            });

            socket2.on(ClientEvents.Disconnect, async () => {
                await deleteTestUser(testUser2);

                done();
            });
        };

        mainTest()
    });

    test("should reconnect", (done) => {
        const mainTest = async () => {
            let gameWasStarted = true;
            const testUser1 = await createTestUser();
            const testUser2 = await createTestUser();

            const token1 = sign({ ID: testUser1._id }, process.env.SECRER_KEY || "secret");
            let socket1 = io("http://localhost:3001", { auth: { token: token1 } });

            const token2 = sign({ ID: testUser2._id }, process.env.SECRER_KEY || "secret");
            const socket2 = io("http://localhost:3001", { auth: { token: token2 } });

            socket1.on(ClientEvents.Connect, () => {
                socket2.on(ClientEvents.Connect, () => {
                    const gameRequest: GameRequestDto = {
                        initiator: testUser1,
                        receptor: testUser2,
                        gameType: GameTypes.casual
                    };

                    socket1.emit(ServerEvents.GameRequest, gameRequest);
                });
            });

            socket1.on(ClientEvents.GameCreated, async (gameRequestDto) => {
                socket1.emit(ServerEvents.GameContinue, gameRequestDto);
            });

            socket2.on(ClientEvents.GameRequest, (async (gameRequestDto) => {
                socket2.emit(ServerEvents.GameCreate, gameRequestDto);

                socket2.on(ClientEvents.GameCreated, async (game: GameRequestDto) => {
                    socket2.emit(ServerEvents.GameContinue, game);

                    socket2.on(ClientEvents.GameContinue, async (game: Game) => {
                        if (gameWasStarted) {
                            socket1.disconnect();
                        }

                        if (!gameWasStarted) {
                            const currentGame = await databaseService.getGameByUsers(testUser1._id!, testUser2._id!);

                            expect(currentGame?.users.find(x => x.status === "offline")).toBeUndefined();

                            socket1.disconnect();
                            socket2.disconnect();

                            sleep(1000);

                            databaseService.deleteUser(testUser1._id!);
                            databaseService.deleteUser(testUser2._id!);
                            done();
                        }
                    });
                });
            }) as ClientGameRequestEvent);

            socket2.on(ClientEvents.OpponentDisconnect, async () => {
                if (gameWasStarted) {
                    socket1 = io("http://localhost:3001", { auth: { token: token1 } });
                    socket1.on(ClientEvents.Connect, () => {
                        socket1.on(ClientEvents.GameContinueRequest, async (gameRequestDto) => {
                            socket1.emit(ServerEvents.GameContinue, gameRequestDto);
                        });
                    });
                }

                gameWasStarted = false;
            });
        };

        mainTest()
    });
});