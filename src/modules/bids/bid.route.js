const { Router } = require("express");
const router = Router();
const bidController = require("./bid.controller");
const validateRequest = require("../../middlewares/validateRequest");
const { bidSchema } = require("./bid.validate");
const accessControl = require("../../middlewares/verifyToken");
const { allowedRoles } = require("../../config/constants");
//
router.post(
  "/",
  // validateRequest(bidSchema),
  // accessControl(allowedRoles.admin),
  bidController.createBid
);
router.patch(
  "/:id",
  validateRequest(bidSchema),
  // accessControl(allowedRoles.admin),
  bidController.updateBid
);
router.get("/", bidController.getBids);
router.get("/:id", bidController.getSingleBid);
router.delete("/:id", bidController.deleteBid);

module.exports = router;
