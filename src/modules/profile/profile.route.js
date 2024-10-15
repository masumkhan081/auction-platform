const { Router } = require("express");
const router = Router();
const profileController = require("./profile.controller");
const accessControl = require("../../middlewares/verifyToken");
const allowedRoles = require("../../config/constants");
//
router.get(
  "/my-profile",
  accessControl([allowedRoles.bidder, allowedRoles.admin, allowedRoles.seller]),
  profileController.getProfileDetail
);
//
router.patch(
  "/my-profile",
  accessControl([allowedRoles.bidder, allowedRoles.admin, allowedRoles.seller]),
  profileController.updateProfile
);
//
router.delete(
  "/my-profile",
  accessControl([allowedRoles.bidder, allowedRoles.admin, allowedRoles.seller]),
  profileController.deleteProfile
);
//
router.get(
  "/bidder-list",
  accessControl([allowedRoles.admin]),
  profileController.getBidderProfiles
);
router.get(
  "/seller-list",
  accessControl([allowedRoles.admin]),
  profileController.getSellerProfiles
);
router.get(
  "/my-bids",
  accessControl([allowedRoles.bidder]),
  profileController.getBidHistory
);
router.get(
  "/my-products",
  accessControl([allowedRoles.seller]),
  profileController.getProductList
);
router.get(
  "/my-auctions",
  accessControl([allowedRoles.seller]),
  profileController.getAuctionHistory
);
//

module.exports = router;
