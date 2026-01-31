import { createServer } from "http";
import express from "express";
import { Server } from "socket.io";
import { print } from "./utilities/print.js";
import dotenv from "dotenv";

dotenv.config();
const port = process.env.PORT || 3000;

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const ROOM = "group";

io.on("connection", (socket) => {
  print(`${socket.id} is connected`);

  socket.on("join-room", async (username) => {
    console.log(`${username} is joining the ${ROOM}`);
    await socket.join(ROOM);

    // send to all
    // io.to("group").emit("roomNotice", username)

    // broadcast
    socket.to(ROOM).emit("room-notice", username);
  });

  socket.on("chat-message", (msg) => {
    socket.to(ROOM).emit("chat-message", msg);
  });

  socket.on("typing", (username) => {
    socket.to(ROOM).emit("typing", username);
  });
  
  socket.on("stop-typing", (username) => {
    socket.to(ROOM).emit("stop-typing", username);
  });
});

app.get("/", (req, res) => {
  res.send("<h1>Hello Socket<h1>");
});

server.listen(port, () => {
  print(`Server is listening at http://localhost:${port}`);
});
