const { Router } = require("express");
const router = Router();
const productController = require("./product.controller");
const { uploadProductImages } = require("../../utils/fileHandle");
const accessControl = require("../../middlewares/verifyToken");
const { userRoles } = require("../../config/constants");
const validateRequest = require("../../middlewares/validateRequest");
const {
  createProductSchema,
  updateProductSchema, 
} = require("./product.validate");
//
router.get("/", productController.getProducts);
router.get("/:id", productController.getSingleProduct);
router.post(
  "/",
  accessControl([userRoles.seller]),
  uploadProductImages,
  validateRequest(createProductSchema),
  productController.createProduct
);
router.patch(
  "/:id",
  accessControl([userRoles.seller, userRoles.admin]),
  uploadProductImages,
  validateRequest(updateProductSchema),
  productController.updateProduct
);
router.delete(
  "/:id",
  accessControl([userRoles.admin, userRoles.seller]),
  productController.deleteProduct // after certain condition apply
);
//
module.exports = router;
