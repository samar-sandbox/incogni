import {
  MESSAGE_REQUEST,
  SELECT_MODE,
} from "../../common/enums/message.enum.js";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../common/exceptions/app.exception.js";
import {
  DbService,
  Message,
  MessageRequest,
  User,
} from "../../database/index.js";
import { createConversation } from "../conversations/conversation.service.js";

const userRepo = new DbService(User);
const messageRepo = new DbService(Message);
const requestRepo = new DbService(MessageRequest);

export async function createMessage(messageData, userId) {
  const { attachments, content, receiverId } = messageData;

  const receiver = await userRepo.findById(receiverId, { select: "_id" });
  if (!receiver) {
    return NotFoundError("Receiver not found");
  }

  const message = await messageRepo.create({
    attachments,
    content,
    receiverId,
    senderId: userId,
    isVisible: receiverId === userId,
  });

  return { message: "Message sent successfully", data: { id: message._id } };
}

export async function getGroupedMessages(userId) {
  const messages = await messageRepo.findMany(
    { $or: [{ senderId: userId }, { receiverId: userId }] },
    {
      populate: [
        { path: "receiverId", select: "_id email" },
        { path: "senderId", select: "_id email" },
      ],
    },
  );

  const groupedData = {
    sent: [],
    received: [],
  };

  messages.forEach(
    ({ senderId: sender, receiverId: receiver, isVisible, ...rest }) => {
      if (receiver?._id.toString() === userId) {
        groupedData.received.push({
          ...rest,
          sender: isVisible
            ? { id: sender._id, email: sender.email }
            : undefined,
        });
      } else {
        groupedData.sent.push({
          ...rest,
          receiver: { id: receiver._id, email: receiver.email },
        });
      }
    },
  );

  return {
    message: "Messages retrieved successfully",
    data: groupedData,
  };
}

export async function getMessages(userId, { mode, page, limit }) {
  const where =
    mode === SELECT_MODE.SENT ? { senderId: userId } : { receiverId: userId };

  const populate =
    mode === SELECT_MODE.SENT
      ? { path: "receiverId", select: "_id email" }
      : { path: "senderId", select: "_id email" };

  const { data: messages, pagination } = await messageRepo.findWithPagination(
    where,
    { populate: [populate], page, limit },
  );

  const data = [];
  messages.forEach(
    ({ senderId: sender, receiverId: receiver, isVisible, ...rest }) => {
      if (mode === SELECT_MODE.SENT) {
        data.push({
          ...rest,
          receiver: { id: receiver._id, email: receiver.email },
        });
      } else {
        data.push({
          ...rest,
          sender: isVisible
            ? { id: sender._id, email: sender.email }
            : undefined,
        });
      }
    },
  );

  return {
    message: "Messages retrieved successfully",
    data: { pagination, data },
  };
}

export async function sendRequest({ userId, messageId }) {
  const message = await messageRepo.findById(messageId, {
    select: "_id receiverId senderId isVisible",
  });

  if (!message) {
    return NotFoundError("Message not found");
  }

  if (message.receiverId.toString() !== userId) {
    return ForbiddenError(
      "You are not authorized to request the sender's identity for this message",
    );
  }

  if (!message.senderId) {
    return BadRequestError(
      "The sender's identity cannot be requested for a message sent by a guest",
    );
  }

  if (message.isVisible) {
    return BadRequestError("The sender's identity has been already revealed");
  }

  const messageRequest = await requestRepo.findOne(
    { messageId, status: MESSAGE_REQUEST.PENDING },
    { select: "_id" },
  );
  if (messageRequest) {
    return BadRequestError(
      "Identity request has been already sent for this message",
    );
  }

  const request = await requestRepo.create({
    messageId,
    senderId: message.receiverId,
    receiverId: message.senderId,
    status: MESSAGE_REQUEST.PENDING,
  });

  return {
    message: "Request sent successfully",
    data: { id: request._id, status: request.status },
  };
}

export async function getGroupedRequests(userId) {
  const requests = await requestRepo.findMany(
    { $or: [{ senderId: userId }, { receiverId: userId }] },
    { populate: [{ path: "senderId", select: "_id email" }] },
  );

  const groupedData = {
    sent: [],
    received: [],
  };

  requests.forEach(({ senderId: sender, receiverId: receiver, ...rest }) => {
    if (receiver?._id.toString() === userId) {
      if (rest.status !== MESSAGE_REQUEST.CANCELED) {
        groupedData.received.push({
          ...rest,
          sender: { id: sender._id, email: sender.email },
        });
      }
    } else {
      groupedData.sent.push(rest);
    }
  });

  return {
    message: "Requests retrieved successfully",
    data: groupedData,
  };
}

export async function getRequests(userId, { mode, page, limit }) {
  const where =
    mode === SELECT_MODE.SENT ? { senderId: userId } : { receiverId: userId };

  const { data: requests, pagination } = await requestRepo.findWithPagination(
    where,
    { populate: [{ path: "senderId", select: "_id email" }], page, limit },
  );

  const data = [];
  requests.forEach(({ senderId: sender, receiverId: receiver, ...rest }) => {
    if (mode === SELECT_MODE.SENT) {
      data.push(rest);
    } else if (rest.status !== MESSAGE_REQUEST.CANCELED) {
      data.push({
        ...rest,
        sender: { id: sender._id, email: sender.email },
      });
    }
  });

  return {
    message: "Requests retrieved successfully",
    data: { pagination, data },
  };
}

export async function getRequest(requestId, userId) {
  const request = await requestRepo.findOne(
    {
      _id: requestId,
      $or: [{ senderId: userId }, { receiverId: userId }],
    },
    {
      select: "_id status senderId",
      populate: [{ path: "messageId", select: "-receiverId -senderId" }],
    },
  );

  if (
    !request ||
    (request.status === MESSAGE_REQUEST.CANCELED &&
      request.senderId.toString() !== userId)
  ) {
    return NotFoundError("Request not found");
  }

  const { messageId: message, ...rest } = request;

  return {
    message: "Request retrieved successfully",
    data: { ...rest, message },
  };
}

export async function deleteRequest(requestId, userId) {
  const request = await requestRepo.findById(requestId, {
    select: "_id status senderId",
  });

  if (!request) {
    return NotFoundError("Request not found");
  }

  if (request.senderId.toString() !== userId) {
    return ForbiddenError("You are not authorized to cancel the request");
  }

  if (request.status !== MESSAGE_REQUEST.PENDING) {
    return BadRequestError(`Cannot cancel '${request.status}' request`);
  }

  const updatedRequest = await requestRepo.findByIdAndUpdate(
    requestId,
    { status: MESSAGE_REQUEST.CANCELED },
    { select: "_id status" },
  );

  return {
    message: "Request deleted successfully",
    data: updatedRequest,
  };
}

export async function updateRequest({ userId, requestId, requestData }) {
  const request = await requestRepo.findById(requestId);

  if (!request) {
    return NotFoundError("Request not found");
  }

  if (request.receiverId.toString() !== userId) {
    return ForbiddenError("You are not authorized to update the request");
  }

  const updatedRequest = await requestRepo.findByIdAndUpdate(
    requestId,
    requestData,
    { select: "_id status" },
  );

  let conversationId;
  if (updatedRequest.status === MESSAGE_REQUEST.ACCEPTED) {
    conversationId = await createConversation({
      receiverId: request.senderId,
      senderId: request.receiverId,
      messageId: request.messageId,
    });

    await messageRepo.updateOne(
      { _id: request.messageId },
      { isVisible: true },
    );
  }

  return {
    message: "Request updated successfully",
    data: { ...updatedRequest, conversationId },
  };
}
