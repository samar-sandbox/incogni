import { Router } from "express";
import { validation } from "../../common/middlewares/validation.middleware.js";
import {
  createRequestSchema,
  getQuerySchema,
  requestSchema,
  messageSchema,
  updateRequestSchema,
} from "./message.schema.js";
import {
  createMessage,
  deleteRequest,
  getGroupedMessages,
  getGroupedRequests,
  getMessages,
  getRequest,
  getRequests,
  sendRequest,
  updateRequest,
} from "./message.service.js";
import {
  authentication,
  multerInstance,
  upload,
} from "../../common/middlewares/index.js";
import { FILE_TYPE } from "../../common/enums/file.enum.js";

const router = Router();

// Create message
router.post(
  "/",
  authentication(true, true),
  upload(multerInstance.array("attachments"), FILE_TYPE.IMAGE, false),
  validation(messageSchema),
  async (req, res) => {
    const {
      data: { body, files },
      user,
    } = req;

    const result = await createMessage({ ...body, ...files }, user?.id);

    return res.status(201).json({ success: true, ...result });
  },
);

router.use(authentication());

// Get messages
router.get("/", validation(getQuerySchema), async (req, res) => {
  const result = await getMessages(req.user.id, req.data.query);

  return res.status(200).json({ success: true, ...result });
});

router.get("/grouped", async (req, res) => {
  const result = await getGroupedMessages(req.user.id);

  return res.status(200).json({ success: true, ...result });
});

// Send identity request
router.post(
  "/:messageId",
  validation(createRequestSchema),
  async (req, res) => {
    const result = await sendRequest({
      userId: req.user.id,
      messageId: req.data.params.messageId,
    });

    return res.status(201).json({ success: true, ...result });
  },
);

// Get requests
router.get("/requests", validation(getQuerySchema), async (req, res) => {
  const result = await getRequests(req.user.id, req.data.query);

  return res.status(200).json({ success: true, ...result });
});

router.get("/requests/grouped", async (req, res) => {
  const result = await getGroupedRequests(req.user.id);

  return res.status(200).json({ success: true, ...result });
});

// Get request by ID
router.get(
  "/requests/:requestId",
  validation(requestSchema),
  async (req, res) => {
    const result = await getRequest(req.data.params.requestId, req.user.id);

    return res.status(200).json({ success: true, ...result });
  },
);

// Update request status
router.patch(
  "/requests/:requestId",
  validation(updateRequestSchema),
  async (req, res) => {
    const { params, body } = req.data;

    const result = await updateRequest({
      userId: req.user.id,
      requestId: params.requestId,
      requestData: body,
    });

    return res.status(200).json({ success: true, ...result });
  },
);

// Delete/Cancel request
router.delete(
  "/requests/:requestId",
  validation(requestSchema),
  async (req, res) => {
    const result = await deleteRequest(req.data.params.requestId, req.user.id);

    return res.status(200).json({ success: true, ...result });
  },
);

export default router;
