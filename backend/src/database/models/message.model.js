import { model, Schema } from "mongoose";
import { MESSAGE_REQUEST } from "../../common/enums/message.enum.js";

const messageSchema = new Schema(
  {
    content: {
      type: String,
      required: [
        function () {
          return this.attachments?.length === 0;
        },
        "Content is required",
      ],
      maxLength: [500, "Content must be less than 500 characters long"],
    },
    attachments: [String],
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: [true, "Receiver ID is required"],
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
    isVisible: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const requestSchema = new Schema(
  {
    messageId: {
      type: Schema.Types.ObjectId,
      ref: "message",
      required: [true, "Message ID is required"],
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    }, // Recipient requesting the original sender's identity
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    }, // Original authenticated sender who must respond
    status: {
      type: String,
      enum: {
        values: Object.values(MESSAGE_REQUEST),
        message:
          "`{VALUE}` is not a valid enum value for path `status`: pending, canceled, rejected, and accepted",
      },
      default: MESSAGE_REQUEST.PENDING,
    },
  },
  { timestamps: true },
);

export const Message = model("message", messageSchema);
export const MessageRequest = model("message_request", requestSchema);
