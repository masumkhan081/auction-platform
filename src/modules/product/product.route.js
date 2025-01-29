const { Router } = require("express");
const router = Router();
const productController = require("./product.controller");
const { uploadProductImages } = require("../../utils/fileHandle");
const accessControl = require("../../middlewares/verifyToken");
const { allowedRoles } = require("../../config/constants");
const validateRequest = require("../../middlewares/validateRequest");
const {
  createProductSchema,
  updateProductSchema,
  adminApprovalSchema,
} = require("./product.validate");
// 
router.get("/", productController.getProducts);
// 
router.get("/:id", productController.getSingleProduct);
//
router.post(
  "/",
  accessControl([allowedRoles.seller]),
  uploadProductImages,
  validateRequest(createProductSchema),
  productController.createProduct
);
//
router.patch(
  "/:id",
  accessControl([allowedRoles.seller]),
  uploadProductImages,
  validateRequest(updateProductSchema),
  productController.updateProduct
);
//
router.delete(
  "/:id",
  accessControl([allowedRoles.admin, allowedRoles.seller]),
  productController.deleteProduct // after certain condition apply
);
//
router.patch(
  "/admin-approval/:id",
  accessControl([allowedRoles.admin]),
  validateRequest(adminApprovalSchema),
  productController.updateApprovalByAdmin
);
//
module.exports = router;
