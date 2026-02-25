import { createServer } from "http";
import express from "express";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const port = Number(process.env.PORT || 8000);
const normalizeOrigin = (value: string) => value.replace(/\/+$/, "");
const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  "http://localhost:5173,https://code-chat-frontend-xi.vercel.app"
)
  .split(",")
  .map((origin) => normalizeOrigin(origin.trim()))
  .filter(Boolean);

const app = express();

// Enable CORS for all routes
app.use(
  cors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    methods: ["GET", "POST"],
  }),
);

const server = createServer(app);
const io = new Server(server);

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

app.get("/", (req: express.Request, res: express.Response) => {
  res.send("<h1>Hello Socket<h1>");
});

server.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});
