import mongoose from "mongoose";
import config from "../config/config.js";
import { User, Message } from "./models/index.js";

export async function connectDatabase() {
  console.log(`Connecting to database`);

  await mongoose.connect(config.dbURI);

  await User.syncIndexes();
  await Message.syncIndexes();

  console.log("Database connected successfully");
}
