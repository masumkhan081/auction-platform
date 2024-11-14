const { Router } = require("express");
const router = Router();
const bidController = require("./bid.controller");
const validateRequest = require("../../middlewares/validateRequest");
const { bidCreateSchema, bidUpdateSchema } = require("./bid.validate");
const accessControl = require("../../middlewares/verifyToken");
const { userRoles } = require("../../config/constants");
//
router.post(
  "/",
  validateRequest(bidCreateSchema),
  accessControl([userRoles.bidder]),
  bidController.createBid
);
//
router.patch(
  "/:id",
  validateRequest(bidUpdateSchema),
  accessControl([userRoles.bidder]),
  bidController.updateBid
);
//
router.get("/", bidController.getBids); // filterable with specific auction (req.query.auction)  / public
//
/* get bids, if seller - bids on his any auctions, if bidder - only bids that is posted by him
   filterable with auction id  (req.query.auction)
*/
router.get("/:bidId", bidController.getSingleBid);
//
router.delete(
  "/:id",
  accessControl([userRoles.bidder]),
  bidController.deleteBid
);

module.exports = router;
