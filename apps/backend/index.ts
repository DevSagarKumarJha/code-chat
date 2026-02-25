import { createServer } from "http";
import express from "express";
import { Server } from "socket.io";

const port = 8000;

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const ROOM = "group";

io.on("connection", (socket) => {
  socket.on("join-room", async (username: string) => {
    await socket.join(ROOM);

    // send to all
    // io.to("group").emit("roomNotice", username)

    // broadcast
    socket.to(ROOM).emit("room-notice", username);
  });

  socket.on("chat-message", (msg: string) => {
    socket.to(ROOM).emit("chat-message", msg);
  });

  socket.on("typing", (username: string) => {
    socket.to(ROOM).emit("typing", username);
  });

  socket.on("stop-typing", (username: string) => {
    socket.to(ROOM).emit("stop-typing", username);
  });
});

app.get("/", (req, res) => {
  res.send("<h1>Hello Socket<h1>");
});

server.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
