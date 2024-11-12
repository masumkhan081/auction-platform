const { Router } = require("express");
const router = Router();
const auctionController = require("./auction.controller");
const validateRequest = require("../../middlewares/validateRequest");
const { auctionCreateSchema } = require("./auction.validate");
const accessControl = require("../../middlewares/verifyToken");
const { allowedRoles } = require("../../config/constants");
//
router.get("/test-auction-times", auctionController.getTestAuctionTime);
// 
router.post(
  "/",
  accessControl([allowedRoles.seller]),
  validateRequest(auctionCreateSchema),
  auctionController.createAuction
);
//
router.patch(
  "/:id",
  accessControl([allowedRoles.seller]),
  auctionController.updateAuction
);
router.get("/", auctionController.getAuctions);
router.get("/:id", auctionController.getSingleAuction);
router.delete(
  "/:id",
  accessControl([allowedRoles.seller, allowedRoles.admin]),
  auctionController.deleteAuction
);
//

module.exports = router;
