const { Router } = require("express");
const router = Router();
const categoryController = require("./category.controller");
const validateRequest = require("../../middlewares/validateRequest");
const {
  categoryPostSchema,
  categoryPatchSchema,
} = require("./category.validate");
const accessControl = require("../../middlewares/verifyToken");
const { allowedRoles } = require("../../config/constants");
//
router.post(
  "/",
  validateRequest(categoryPostSchema),
  accessControl([allowedRoles.admin]),
  categoryController.createProductCategory
);
//
router.patch(
  "/:id",
  validateRequest(categoryPatchSchema),
  accessControl([allowedRoles.admin]),
  categoryController.updateCategory
);
//
router.get("/", categoryController.getCategories);
//
router.get("/:id", categoryController.getSingleCategory);
//
router.delete(
  "/:id",
  accessControl([allowedRoles.admin]),
  categoryController.deleteCategory
);
//
module.exports = router;
