const { Router } = require("express");
const router = Router();
const profileController = require("./profile.controller");
const { isPatchBodyValid, isPostBodyValid } = require("./profile.validate");
//
router.post("/", profileController.createSeller);
router.get("/", profileController.getSellers);
router.patch("/:id", profileController.updateSeller);
router.delete("/:id", profileController.deleteSeller);
//
module.exports = router;
