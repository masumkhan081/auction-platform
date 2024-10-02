const { Router } = require("express");
const router = Router();
const profileController = require("./profile.controller");
const { isPatchBodyValid, isPostBodyValid } = require("./profile.validate");
//
router.post("/", profileController.createProfile);
router.get("/", profileController.getProfiles);
router.patch("/:id", profileController.updateProfile);
router.delete("/:id", profileController.deleteProfile);
//
module.exports = router;
