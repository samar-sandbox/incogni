import express from "express";
import cors from "cors";
import { errorHandler } from "./common/middlewares/index.js";
import { localization } from "./common/middlewares/localization.middleware.js";
import config from "./config/config.js";
import { connectDatabase } from "./database/index.js";
import {
  authController,
  messageController,
  userController,
} from "./modules/index.js";
import { connectRedis } from "./common/services/redis.service.js";

const port = config.port;

const app = express();

app.use(express.json());
app.use(cors({ origin: "http://localhost:5173" }));
app.use(localization);

app.get("/", (req, res) => {
  return res.json({ message: "Incogni API is running" });
});

app.use("/auth", authController);
app.use("/users", userController);
app.use("/message", messageController);

app.use("/*splat", (req, res) => {
  const path = req.params.splat;
  const method = req.method;

  return res.status(404).json({
    success: false,
    message: `Route ${method} ${path.join("/")} not found`,
  });
});

app.use(errorHandler);

async function initConnections() {
  await connectDatabase();
  await connectRedis();
}

initConnections()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.log(`Error connecting database: ${error}`);
  });
