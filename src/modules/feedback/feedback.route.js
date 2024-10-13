const { Router } = require("express");
const router = Router();
const feedbackController = require("./feedback.controller");
const validateRequest = require("../../middlewares/validateRequest");
const {
  feedbackPostSchema,
  feedbackPatchSchema,
} = require("./feedback.validate");
const accessControl = require("../../middlewares/verifyToken");
const { allowedRoles } = require("../../config/constants");
//
router.post(
  "/",
  validateRequest(feedbackPostSchema),
  accessControl([allowedRoles.admin, allowedRoles.seller]),
  feedbackController.createFeedback
);
//
router.patch(
  "/:id",
  validateRequest(feedbackPatchSchema),
  accessControl([allowedRoles.admin, allowedRoles.seller]),
  feedbackController.updateFeedback
);
//
router.get("/", feedbackController.getFeedbacks);
//
router.get("/:id", feedbackController.getSingleFeedback);
//
router.delete(
  "/:id",
  accessControl([allowedRoles.admin]),
  feedbackController.deleteFeedback
);
//
module.exports = router;
