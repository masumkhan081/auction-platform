const { Router } = require("express");
const router = Router();
const auctionController = require("./auction.controller");
const validateRequest = require("../../middlewares/validateRequest");
const { auctionSchema } = require("./auction.validate");
const accessControl = require("../../middlewares/verifyToken");
const { allowedRoles } = require("../../config/constants");
//
router.post(
  "/",
  validateRequest(auctionSchema),
  // accessControl(allowedRoles.admin),
  auctionController.createAuction
);
router.patch(
  "/:id",
  // validateRequest(auctionSchema),
  // accessControl(allowedRoles.admin),
  auctionController.updateAuction
);
router.get("/", auctionController.getAuctions);
router.get("/:id", auctionController.getSingleAuction);
router.delete("/:id", auctionController.deleteAuction);

module.exports = router;
