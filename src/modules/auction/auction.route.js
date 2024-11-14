const { Router } = require("express");
const router = Router();
const auctionController = require("./auction.controller");
const validateRequest = require("../../middlewares/validateRequest");
const { auctionCreateSchema } = require("./auction.validate");
const accessControl = require("../../middlewares/verifyToken");
const { userRoles } = require("../../config/constants");
//
router.get("/test-auction-times", auctionController.getTestAuctionTime);
//
router.post(
  "/",
  accessControl([userRoles.seller]),
  validateRequest(auctionCreateSchema),
  auctionController.createAuction
);
//
router.patch(
  "/:id",
  accessControl([userRoles.seller]),
  auctionController.updateAuction
);
router.get("/", auctionController.getAuctions);
router.get("/:id", auctionController.getSingleAuction);
router.delete(
  "/:id",
  accessControl([userRoles.seller, userRoles.admin]),
  auctionController.deleteAuction
);
//

module.exports = router;
