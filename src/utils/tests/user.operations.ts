import { User } from "@panda-chess/pdc-core";
import { databaseService } from "@panda-chess/pdc-microservices-agregator";

export const createTestUser = async () => {
    const user = await databaseService.createUser({
        email: "test",
        password: "test",
        name: "test",
        draws: 0,
        losses: 0,
        wins: 0,
        score: 0
    });

    return user;
};

export const deleteTestUser = async (user: User) => {
    await databaseService.deleteUser(user._id!);
};