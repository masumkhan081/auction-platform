const productService = require("./product.service");
const {
  sendCreateResponse,
  sendDeletionResponse,
  sendErrorResponse,
  sendFetchResponse,
  sendSingleFetchResponse,
  sendUpdateResponse,
  responseMap,
} = require("../../utils/responseHandler");
const { entities, userRoles } = require("../../config/constants");
const Product = require("./product.model");
const Auction = require("../auction/auction.model");
const {
  uploadHandler,
  fieldsMap,
  removeFile,
} = require("../../utils/fileHandle");
const Category = require("../category/category.model");
const validateData = require("../../middlewares/validateData");
const {
  adminApprovalSchema,
  updateProductSchema,
} = require("./product.validate");
const categoryModel = require("../category/category.model");
//
//
async function createProduct(req, res) {
  try {
    const { productName, category, productDetail } = req.body;
    const { name: fieldName, maxCount } = fieldsMap[entities.product][0];

    const filesInBody = req?.files?.[fieldName]?.length || 0;

    // Check if product name is unique per seller
    const existingProduct = await Product.findOne({
      productName,
      seller: req.userId,
    });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "You already have a product with this name.",
      });
    }

    // Check if the category exists
    const categoryExist = await Category.findById(category);
    if (!categoryExist) {
      return res
        .status(400)
        .json({ success: false, message: "Category doesn't exist" });
    }

    // Check for file upload limit
    if (filesInBody > maxCount) {
      return res.status(400).json({
        success: false,
        message: `Exceeded maximum file upload limit. Allowed: ${maxCount}, Received: ${filesInBody}.`,
      });
    }

    // Handle file uploads
    let fileUrls = [];
    if (req?.files?.[fieldName]) {
      fileUrls = await uploadHandler({
        files: req.files[fieldName],
        fieldName,
      });

      // If fileUrls is null, it indicates an error in file upload
      if (fileUrls === null) {
        return res.status(500).json({
          success: false,
          message: "Error uploading files. Please try again.",
        });
      }
    }

    // Create product
    const addResult = await Product.create({
      productName,
      seller: req.userId,
      category,
      productDetail,
      productImages: fileUrls,
    });

    sendCreateResponse({
      res,
      what: entities.product,
      data: addResult,
    });
  } catch (error) {
    console.error("Error creating product:", error.message);
    sendErrorResponse({ res, error, what: entities.product });
  }
}

//
async function updateProduct(req, res) {
  try {
    const targetProduct = await Product.findById(req.params.id);
    let update = {};
    //
    if (!targetProduct) {
      return res.status(400).json({
        success: false,
        message: "Target product not found.",
      });
    }
    //
    const { role } = req;
    const { productName, category, productDetail, adminApproval, reviewNote } =
      req.body;

    if (role === userRoles.admin) {
      const { success, message, messages } = validateData({
        schema: adminApprovalSchema,
        data: { adminApproval, reviewNote },
      });
      if (!success) {
        return res.status(400).json({
          success: false,
          message,
          messages,
        });
      }
      if (
        adminApproval &&
        ["SOLD", "ON_AUCTION"].includes(targetProduct.status)
      ) {
        return res.status(400).json({
          success: false,
          message: `Change of admin approval when product is ${targetProduct.status} is not possible`,
        });
      }

      update.adminApproval = adminApproval || targetProduct.adminApproval;
      update.reviewNote =
        adminApproval === "APPROVED"
          ? ""
          : reviewNote || targetProduct.reviewNote;
    }
    //
    if (role === userRoles.seller) {
      const { success, message, messages } = validateData({
        schema: updateProductSchema,
        data: { productName, category, productDetail },
      });
      //
      if (!success) {
        return res.status(400).json({
          success: false,
          message,
          messages,
        });
      }

      const targetCategory = await categoryModel.findById(category);

      if (!targetCategory) {
        return res.status(400).json({
          success: false,
          message: "Target category doesn't exist.",
        });
      }

      const { name: fieldName, maxCount } = fieldsMap[entities.product][0];

      const filesInBody = req?.files?.[fieldName]?.length || 0;

      // Check for file upload limit
      if (filesInBody > maxCount) {
        return res.status(400).json({
          success: false,
          message: `Exceeded maximum file upload limit. Allowed: ${maxCount}, Received: ${filesInBody}.`,
        });
      }

      // Handle file uploads
      let fileUrls = [];
      if (req?.files?.[fieldName]) {
        fileUrls = await uploadHandler({
          files: req.files[fieldName],
          fieldName,
        });

        // If fileUrls is null, it indicates an error in file upload
        if (fileUrls === null) {
          return res.status(500).json({
            success: false,
            message: "Error uploading files. Please try again.",
          });
        }

        await Promise.all(
          targetProduct.productImages.map((url) => removeFile({ fileUrl: url }))
        );
      }
      // Prepare fields to update

      update.productName = productName || targetProduct.productName;
      update.category = category || targetProduct.category;
      update.productDetail = productDetail || targetProduct.productDetail;
      update.productImages =
        filesInBody > 0
          ? fileUrls
          : req.body[fieldName] === undefined
          ? targetProduct.productImages
          : [];
    }

    // Update product
    const editResult = await productService.updateProduct({
      id: req.params.id,
      data: update,
    });

    sendUpdateResponse({
      res,
      what: entities.product,
      data: editResult,
    });
  } catch (error) {
    console.error("Error updating product:", error.message);
    sendErrorResponse({ res, error, what: entities.product });
  }
}

async function getProducts(req, res) {
  try {
    const result = await productService.getProducts(req.query);
    sendFetchResponse({ res, data: result, what: entities.product });
  } catch (error) {
    sendErrorResponse({
      res,
      error,
      what: entities.product,
    });
  }
}
//
async function getSingleProduct(req, res) {
  try {
    const result = await productService.getSingleProduct(req.params.id);
    sendSingleFetchResponse({
      res,
      data: result,
      what: entities.product,
    });
  } catch (error) {
    console.log("err: getSingleProduct: " + error.message);
    sendErrorResponse({ res, error: result, what: entities.product });
  }
}
//
async function deleteProduct(req, res) {
  try {
    const isUsed = await Auction.countDocuments({ product: req.params.id });

    if (isUsed > 0) {
      return res.status(400).json({
        success: false,
        message: "Can't delete product that used in auction.",
      });
    }

    const result = await productService.deleteProduct(req.params.id);
    sendDeletionResponse({
      res,
      data: result,
      what: entities.product,
    });
  } catch (error) {
    console.error("Controller: deleteProduct:", error.message); // Log the error
    sendErrorResponse({
      res,
      error,
      what: entities.product,
    });
  }
}
//
async function getProductList(req, res) {
  try {
    const result = await productService.getProducts({
      ...req.query,
      seller: req.userId,
    });

    sendFetchResponse({ res, data: result, what: entities.product });
  } catch (error) {
    sendErrorResponse({
      res,
      error,
      what: entities.bid,
    });
  }
}
//
module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getSingleProduct,
  getProductList,
};
