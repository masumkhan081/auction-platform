const { Router } = require("express");
const router = Router();
const feedbackController = require("./feedback.controller");
const validateRequest = require("../../middlewares/validateRequest");
const {
  feedbackPostSchema,
  feedbackPatchSchema,
} = require("./feedback.validate");
const accessControl = require("../../middlewares/verifyToken");
const { userRoles } = require("../../config/constants");
//
router.post(
  "/",
  validateRequest(feedbackPostSchema),
  accessControl([userRoles.admin, userRoles.seller]),
  feedbackController.createFeedback
);
//
router.patch(
  "/:id",
  validateRequest(feedbackPatchSchema),
  accessControl([userRoles.admin, userRoles.seller]),
  feedbackController.updateFeedback
);
//
router.get("/", feedbackController.getFeedbacks);
//
router.get("/:id", feedbackController.getSingleFeedback);
//
router.delete(
  "/:id",
  accessControl([userRoles.admin]),
  feedbackController.deleteFeedback
);
//
module.exports = router;
