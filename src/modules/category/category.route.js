const { Router } = require("express");
const router = Router();
const categoryController = require("./category.controller");
const validateRequest = require("../../middlewares/validateRequest");
const {
  categoryPostSchema,
  categoryPatchSchema,
} = require("./category.validate");
const accessControl = require("../../middlewares/verifyToken");
const { userRoles } = require("../../config/constants");
//
router.post(
  "/",
  accessControl([userRoles.admin]),
  validateRequest(categoryPostSchema),
  categoryController.createProductCategory
);
//
router.patch(
  "/:id",
  accessControl([userRoles.admin]),
  validateRequest(categoryPatchSchema),
  categoryController.updateCategory
);
//
router.get("/", categoryController.getCategories);
//
router.get("/:id", categoryController.getSingleCategory);
//
router.delete(
  "/:id",
  accessControl([userRoles.admin]),
  categoryController.deleteCategory
);
//
module.exports = router;
