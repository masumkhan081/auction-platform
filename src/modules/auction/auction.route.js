const { Router } = require("express");
const router = Router();
const auctionController = require("./auction.controller");
const validateRequest = require("../../middlewares/validateRequest");
const {
  auctionCreateSchema,
  auctionEditSchema,
} = require("./auction.validate");
const accessControl = require("../../middlewares/verifyToken");
const { allowedRoles } = require("../../config/constants");
const { convertToUTC } = require("../../utils/timeHandler");

//
router.post("/test-auction-times", (req, res) => {
  //
  const { auctionStart, auctionEnd, timeZone } = req.body;
  // Convert to UTC
  const auctionStartUTC = convertToUTC(auctionStart, timeZone);
  const auctionEndUTC = convertToUTC(auctionEnd, timeZone);
  //
  const auction = {
    start: auctionStartUTC,
    end: auctionEndUTC,
    status: "OPEN",
  };
  res.send("dfdf");
});
//
router.post(
  "/",
  accessControl([allowedRoles.seller]),
  validateRequest(auctionCreateSchema),
  auctionController.createAuction
);
router.patch(
  "/:id",
  accessControl([allowedRoles.seller]),
  validateRequest(auctionEditSchema),
  auctionController.updateAuction
);
router.get("/", auctionController.getAuctions);
router.get("/:id", auctionController.getSingleAuction);
router.delete("/:id", auctionController.deleteAuction);

module.exports = router;
