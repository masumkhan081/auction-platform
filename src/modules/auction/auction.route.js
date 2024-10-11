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
// const { toZonedTime } = require("date-fns-tz");
//
router.post("/test-auction-times", (req, res) => {
  //
  const { auctionStart, auctionEnd, zone } = req.body;

  // Parse the zone offset
  const offset = parseInt(zone.replace("UTC", "").replace(":", ""), 10);

  // Create new Date objects based on the auctionStart and auctionEnd
  const start = new Date(auctionStart); // Assumed to be in UTC
  const end = new Date(auctionEnd); // Assumed to be in UTC

  // Adjust the date based on the offset
  const startInUTC = new Date(start.getTime() - offset * 60 * 60 * 1000);
  const endInUTC = new Date(end.getTime() - offset * 60 * 60 * 1000);

  console.log(`Auction Start in UTC: ${startInUTC.toISOString()}`);
  console.log(`Auction End in UTC: ${endInUTC.toISOString()}`);

  res.send({
    start: startInUTC.getHours() + "--" + startInUTC.getMinutes(),
    end: endInUTC.getHours() + "--" + endInUTC.getMinutes(),
  });
});
//
router.post(
  "/",
  accessControl(allowedRoles.seller),
  validateRequest(auctionCreateSchema),
  auctionController.createAuction
);
router.patch(
  "/:id",
  accessControl(allowedRoles.seller),
  validateRequest(auctionEditSchema),
  auctionController.updateAuction
);
router.get("/", auctionController.getAuctions);
router.get("/:id", auctionController.getSingleAuction);
router.delete("/:id", auctionController.deleteAuction);

module.exports = router;
