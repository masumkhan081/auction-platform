const { Router } = require("express");
const router = Router();
const productController = require("./product.controller");
const { uploadProductImages } = require("../../utils/uploader");
const accessControl = require("../../middlewares/verifyToken");
const { allowedRoles } = require("../../config/constants");
const validateRequest = require("../../middlewares/validateRequest");
const {
  createProductSchema,
  adminApprovalSchema,
} = require("./product.validate");
//
router.get("/", productController.getProducts);
router.post(
  "/",
  uploadProductImages,
  validateRequest(createProductSchema),
  productController.createProduct
);
router.get("/:id", productController.getSingleProduct);
router.patch("/:id", uploadProductImages, productController.updateProduct);

//
//

router.delete(
  "/:id",
  // accessControl(allowedRoles.seller),
  productController.deleteProduct
);

//
router.patch(
  "/admin-approval/:id",
  // accessControl(allowedRoles.admin),
  validateRequest(adminApprovalSchema),
  productController.updateApprovalByAdmin
);
//
module.exports = router;
