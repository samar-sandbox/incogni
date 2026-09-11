import { model, Schema } from "mongoose";

const schema = new Schema();

export const Message = model("message", schema);
