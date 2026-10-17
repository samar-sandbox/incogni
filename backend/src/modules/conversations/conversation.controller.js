import { Router } from "express";
import { validation } from "../../common/middlewares/validation.middleware.js";
import {
  conversationMessageSchema,
  conversationSchema,
} from "./conversation.schema.js";
import {
  createConversationMessage,
  getConversation,
  getConversations,
} from "./conversation.service.js";
import {
  authentication,
  multerInstance,
  upload,
} from "../../common/middlewares/index.js";
import { FILE_TYPE } from "../../common/enums/file.enum.js";
import { paginationQuerySchema } from "../../common/validation/common.schema.js";

const router = Router();

router.use(authentication());

// Get conversations
router.get("/", validation(paginationQuerySchema), async (req, res) => {
  const result = await getConversations(req.user.id, req.data.query);

  return res.status(200).json({ success: true, ...result });
});

// Get conversation
router.get(
  "/:conversationId",
  validation(conversationSchema),
  async (req, res) => {
    const result = await getConversation(
      req.data.params.conversationId,
      req.user.id,
      req.data.query,
    );

    return res.status(200).json({ success: true, ...result });
  },
);

// Add conversation message
router.post(
  "/:conversationId",
  upload(multerInstance.array("attachments"), FILE_TYPE.IMAGE, false),
  validation(conversationMessageSchema),
  async (req, res) => {
    const {
      data: { body, params, files },
      user,
    } = req;

    const result = await createConversationMessage({
      userId: user.id,
      conversationId: params.conversationId,
      messageData: { ...body, ...files },
    });

    return res.status(201).json({ success: true, ...result });
  },
);

export default router;
