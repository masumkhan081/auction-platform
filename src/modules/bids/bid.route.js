const { Router } = require("express");
const router = Router();
const bidController = require("./bid.controller");
const validateRequest = require("../../middlewares/validateRequest");
const { bidCreateSchema, bidUpdateSchema } = require("./bid.validate");
const accessControl = require("../../middlewares/verifyToken");
const { allowedRoles } = require("../../config/constants");
//
router.post(
  "/",
  validateRequest(bidCreateSchema),
  accessControl([allowedRoles.bidder]),
  bidController.createBid
);
router.patch(
  "/:id",
  validateRequest(bidUpdateSchema),
  accessControl([allowedRoles.bidder]),
  bidController.updateBid
);
router.get("/", bidController.getBids);
router.get("/:id", bidController.getSingleBid);
router.get(
  "/history",
  accessControl([allowedRoles.bidder]),
  bidController.getSingleBid
);
router.delete(
  "/:id",
  accessControl([allowedRoles.bidder]),
  bidController.deleteBid
);

module.exports = router;
