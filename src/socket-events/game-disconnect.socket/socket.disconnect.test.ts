import { describe } from "@jest/globals";
import { io } from "socket.io-client";
import { createTestUser, deleteTestUser } from "../../utils/tests/user.operations"
import { sign } from "jsonwebtoken";
import { databaseService } from "@panda-chess/pdc-microservices-agregator";
import { sleep } from "../../utils/tests/sleep";
import { ClientEvents, ClientGameRequestEvent, GameRequestDto, ServerEvents } from "@panda-chess/pdc-core";
import { Game, GameTypes, UserStatus } from "@panda-chess/pdc-core/dist/utils";

describe("Auth Middleware", () => {
    test("should await for the player", (done) => {
        const mainTest = async () => {
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
                        socket1.disconnect();
                    });
                });
            }) as ClientGameRequestEvent);

            socket2.on(ClientEvents.OpponentDisconnect, async () => {
                const currentGame = await databaseService.getGameByUsers(testUser1._id!);

                expect(currentGame?.users.find(x => x.user._id === testUser1._id)?.status).toBe(UserStatus.offline);

                socket2.disconnect();

                await sleep(1000);

                databaseService.deleteUser(testUser1._id!);
                databaseService.deleteUser(testUser2._id!);
                databaseService.deleteGame(currentGame!._id!);
                done();
            });
        };

        mainTest()
    });

    test("should delete the game", (done) => {
        const mainTest = async () => {
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
                        socket1.disconnect();
                    });
                });
            }) as ClientGameRequestEvent);

            socket2.on(ClientEvents.OpponentDisconnect, async () => {
                socket2.disconnect();
                await sleep(1000);

                const currentGame = await databaseService.getGameByUsers(testUser1._id!);

                expect(currentGame).toBeNull();

                databaseService.deleteUser(testUser1._id!);
                databaseService.deleteUser(testUser2._id!);
                done();
            });
        };

        mainTest()
    });
});