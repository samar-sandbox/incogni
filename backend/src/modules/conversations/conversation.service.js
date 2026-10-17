import { NotFoundError } from "../../common/exceptions/app.exception.js";
import {
  Conversation,
  ConversationMessage,
  DbService,
} from "../../database/index.js";

const conversationRepo = new DbService(Conversation);
const messagesRepo = new DbService(ConversationMessage);

export async function createConversation({ senderId, receiverId, messageId }) {
  const conversation = await conversationRepo.create({
    senderId,
    receiverId,
    originalMessageId: messageId,
  });

  return conversation._id;
}

export async function getConversations(userId, { page, limit }) {
  const { data, pagination } = await conversationRepo.findWithPagination(
    { $or: [{ senderId: userId }, { receiverId: userId }] },
    { page, limit },
  );

  return {
    message: "Conversations retrieved successfully",
    data: { pagination, data },
  };
}

export async function getConversation(conversationId, userId, { page, limit }) {
  const conversation = await conversationRepo.findOne({
    _id: conversationId,
    $or: [{ senderId: userId }, { receiverId: userId }],
  });

  if (!conversation) {
    return NotFoundError("Conversation not found");
  }

  const { data: messages, pagination } = await messagesRepo.findWithPagination(
    { conversationId },
    {
      select: "content attachments",
      populate: [{ path: "authorId", select: "_id email image" }],
      page,
      limit,
    },
  );

  return {
    message: "Conversation retrieved successfully",
    data: {
      pagination,
      data: {
        _id: conversation._id,
        originalMessageId: conversation.originalMessageId,
        messages: messages.map(
          ({ content, attachments, authorId: author }) => ({
            content,
            attachments,
            author,
          }),
        ),
      },
    },
  };
}

export async function createConversationMessage({
  userId,
  conversationId,
  messageData,
}) {
  const conversation = await conversationRepo.findOne({
    _id: conversationId,
    $or: [{ senderId: userId }, { receiverId: userId }],
  });

  if (!conversation) {
    return NotFoundError("Conversation not found");
  }

  const message = await messagesRepo.create({
    ...messageData,
    authorId: userId,
    conversationId,
  });

  return {
    message: "Message added successfully",
    data: { id: message._id },
  };
}
