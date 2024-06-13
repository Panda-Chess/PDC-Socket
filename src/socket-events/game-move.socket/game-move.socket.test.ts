import { describe } from "@jest/globals";
import { io } from "socket.io-client";
import { createTestUser, deleteTestUser } from "../../utils/tests/user.operations"
import { sign } from "jsonwebtoken";
import { databaseService } from "@panda-chess/pdc-microservices-agregator";
import { sleep } from "../../utils/tests/sleep";
import { ClientEvents, ClientGameRequestEvent, GameRequestDto, Move, PieceType, ServerEvents, ServerGameRequestEvent, getMoves } from "@panda-chess/pdc-core";
import { Game, GameTypes } from "@panda-chess/pdc-core/dist/utils";

describe("Game Move", () => {
    test("should validate the move", (done) => {
        const mainTest = async () => {
            const testUser1 = await createTestUser();
            const testUser2 = await createTestUser();

            const token1 = sign({ ID: testUser1._id }, process.env.SECRER_KEY || "secret");
            let socket1 = io("http://localhost:3005", { auth: { token: token1 } });

            const token2 = sign({ ID: testUser2._id }, process.env.SECRER_KEY || "secret");
            const socket2 = io("http://localhost:3005", { auth: { token: token2 } });

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

                socket1.on(ClientEvents.GameContinue, async (game: Game) => {
                    const piece = game.gamePieces.find(x => x.color === "white" && x.pieceType === PieceType.Pawn)!;

                    const move: Move = getMoves(piece, game.gamePieces)[0];

                    socket1.emit(ServerEvents.Move, move);
                });
            });

            socket2.on(ClientEvents.GameRequest, (async (gameRequestDto) => {
                socket2.emit(ServerEvents.GameCreate, gameRequestDto);

                socket2.on(ClientEvents.GameCreated, async (game: GameRequestDto) => {
                    socket2.emit(ServerEvents.GameContinue, game);

                    socket2.on("move", async (move: Move) => {
                        expect(move).toBeDefined();

                        const currentGame = await databaseService.getGameByUsers(testUser1._id!, testUser2._id!);

                        expect(currentGame?.currentColor).toBe("black");

                        socket1.disconnect();
                    });
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
});