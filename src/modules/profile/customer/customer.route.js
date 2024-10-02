const { Router } = require("express");
const router = Router();
const customerController = require("./customer.controller");
const { isPatchBodyValid, isPostBodyValid } = require("./customer.validate");
//
router.post("/", customerController.createCustomer);
router.get("/", customerController.getCustomers);
router.patch("/:id", customerController.updateCustomer);
router.delete("/:id", customerController.deleteCustomer);

module.exports = router;
