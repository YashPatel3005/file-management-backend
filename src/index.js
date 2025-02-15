import express from "express";
import http from "http";
import dotenv from "dotenv";
dotenv.config();
import bodyParser from "body-parser";
import cors from "cors";
import path from "path";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
global.__dirname = path.dirname(fileURLToPath(import.meta.url));

import router from "./v1/routes/index.js";

const port = process.env.PORT;
const app = express();

// To connect with database
import connectToDb from "./db/mongoose.js";
connectToDb();

app.use(
  cors({
    credentials: true,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

// version v1
app.use("/v1", router);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("client  connected:", socket.id);
  socket.on("disconnect", () => {
    console.log("client disconnected:", socket.id);
  });
});

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}/`);
});

export { io };
