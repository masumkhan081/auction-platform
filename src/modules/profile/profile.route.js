const { Router } = require("express");
const router = Router();
const profileController = require("./profile.controller");
const auctionController = require("../auction/auction.controller");
const bidController = require("../bids/bid.controller");
const productController = require("../product/product.controller");
const accessControl = require("../../middlewares/verifyToken");
const validateRequest = require("../../middlewares/validateRequest");
const { userRoles } = require("../../config/constants");
const { profileUpdateSchema } = require("./profile.validate");
//
router.get(
  "/my-profile",
  accessControl([userRoles.bidder, userRoles.admin, userRoles.seller]),
  profileController.getProfileDetail
);
//
router.patch(
  "/my-profile",
  accessControl([userRoles.bidder, userRoles.admin, userRoles.seller]),
  validateRequest(profileUpdateSchema),
  profileController.updateProfile
);
//
router.delete(
  "/my-profile",
  accessControl([userRoles.bidder, userRoles.admin, userRoles.seller]),
  profileController.deleteProfile
);
//
router.get(
  "/bidder-list",
  accessControl([userRoles.admin]),
  profileController.getBidderList
);
//
router.get(
  "/seller-list",
  accessControl([userRoles.admin]),
  profileController.getSellerList
);
router.get(
  "/my-bids",
  accessControl([userRoles.bidder, userRoles.seller]),
  bidController.getBidHistory
);

router.get(
  "/my-products",
  accessControl([userRoles.seller]),
  productController.getProductList
);
router.get(
  "/my-auctions",
  accessControl([userRoles.seller]),
  auctionController.getAuctionHistory
);
//

module.exports = router;
