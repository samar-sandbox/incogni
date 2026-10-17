import { model, Schema } from "mongoose";

const conversationSchema = new Schema(
  {
    originalMessageId: {
      type: Schema.Types.ObjectId,
      ref: "message",
      required: true,
      unique: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true },
);

const conversationMessageSchema = new Schema(
  {
    content: {
      type: String,
      required: [
        function () {
          return this.attachments?.length === 0;
        },
        "Content is required",
      ],
      minLength: [1, "Content cannot be empty"],
    },
    attachments: [String],
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "conversation",
      required: true,
      index: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { timestamps: true },
);

export const Conversation = model("conversation", conversationSchema);
export const ConversationMessage = model(
  "conversation_message",
  conversationMessageSchema,
);
