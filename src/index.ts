import dotenv from "dotenv";
import { startServer } from "./socket-events";

dotenv.config();

const serverPort = Number.parseInt(process.env.PORT || "3000");

startServer(serverPort);