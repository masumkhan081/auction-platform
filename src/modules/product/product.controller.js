const productService = require("./product.service");
const {
  sendCreateResponse,
  sendDeletionResponse,
  sendErrorResponse,
  sendFetchResponse,
  sendUpdateResponse,
  responseMap,
} = require("../../utils/responseHandler");
const { operableEntities } = require("../../config/constants");
const Product = require("./product.model");
const Auction = require("../auction/auction.model");
const {
  uploadHandler,
  fieldsMap,
  removeFile,
} = require("../../utils/fileHandle");
const Category = require("../category/category.model");
//
async function createProduct(req, res) {
  try {
    const { productName, category, productDetail } = req.body;

    let fileUrls = [];
    const fieldName = fieldsMap[operableEntities.product][0].name;
    const maxCount = fieldsMap[operableEntities.product][0].maxCount;
    const filesInBody = req?.files?.[fieldName]?.length || 0;

    // Check for file upload limit
    if (filesInBody > maxCount) {
      return res.status(400).send({
        success: false,
        message: `Exceeded maximum file upload limit. Allowed: ${maxCount}, Received: ${filesInBody}.`,
      });
    }

    // Handle file uploads
    if (req?.files?.[fieldName]) {
      for (const file of req.files[fieldName]) {
        try {
          const fileUrl = await uploadHandler({ what: fieldName, file });
          fileUrls.push(fileUrl);
        } catch (error) {
          console.error("File upload error:", error.message);
          // Remove previously uploaded files
          await Promise.all(
            fileUrls.map((url) => removeFile({ fileUrl: url }))
          );
          return res.status(500).send({
            success: false,
            message: "Error uploading files. Please try again.",
          });
        }
      }
      console.log(JSON.stringify(fileUrls));
    }

    const categoryExist = await Category.findById(category);
    if (!categoryExist) {
      return res
        .status(400)
        .send({ success: false, message: "Category doesn't exist" });
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
      what: operableEntities.product,
      data: addResult,
    });
  } catch (error) {
    console.error("Error creating product:", error.message);
    sendErrorResponse({ res, error, what: operableEntities.product });
  }
}

//
async function updateProduct(req, res) {
  try {
    const fieldName = fieldsMap[operableEntities.product][0].name; // Assuming single field for now
    const updatable = await Product.findById(req.params.id);

    if (!updatable) {
      return sendErrorResponse({
        res,
        error: responseMap.idNotFound,
        what: operableEntities.product,
      });
    }

    const maxCount = fieldsMap[operableEntities.product][0].maxCount;
    const filesInBody = req?.files?.[fieldName]?.length || 0;

    // Check for file upload limit
    if (filesInBody > maxCount) {
      return res.status(400).send({
        success: false,
        message: `Exceeded maximum file upload limit. Allowed: ${maxCount}, Received: ${filesInBody}.`,
      });
    }

    let fileUrls = [];

    // Handle file uploads
    if (req?.files?.[fieldName]) {
      for (const file of req.files[fieldName]) {
        try {
          const fileUrl = await uploadHandler({ what: fieldName, file });
          fileUrls.push(fileUrl);
        } catch (error) {
          console.error("File upload error:", error.message);
          // Remove previously uploaded files if any
          await Promise.all(
            fileUrls.map((url) => removeFile({ fileUrl: url }))
          );
          return res.status(500).send({
            success: false,
            message: "Error uploading files. Please try again.",
          });
        }
      }
    }

    const { productName, category, productDetail } = req.body;

    // Prepare fields to update
    const updatedFields = {
      productName: productName || updatable.productName,
      category: category || updatable.category,
      productDetail: productDetail || updatable.productDetail,
      productImages:
        filesInBody > 0
          ? fileUrls
          : req.body[fieldName] === undefined
          ? updatable.productImages
          : [],
    };
    console.log("req.body[fieldName]" + req.body[fieldName]);

    // images are expected to be uploaded whether newly added or old - everytime there's a patch
    // so field is present , no file present means - all images to be deleted
    if (req.body[fieldName] !== undefined) {
      await Promise.all(
        updatable.productImages.map((url) => removeFile({ fileUrl: url }))
      );
    }

    // Update product
    const editResult = await Product.findByIdAndUpdate(
      req.params.id,
      updatedFields,
      { new: true }
    );

    sendUpdateResponse({
      res,
      what: operableEntities.product,
      data: editResult,
    });
  } catch (error) {
    console.error("Error updating product:", error.message);
    sendErrorResponse({ res, error, what: operableEntities.product });
  }
}

async function getProducts(req, res) {
  try {
    const result = await productService.getProducts(req.query);
    if (result instanceof Error) {
      sendErrorResponse({ res, error: result, what: operableEntities.product });
    } else {
      sendFetchResponse({ res, data: result, what: operableEntities.product });
    }
  } catch (error) {
    sendErrorResponse({
      res,
      error,
      what: operableEntities.product,
    });
  }
}
//
async function getSingleProduct(req, res) {
  try {
    const result = await productService.getSingleProduct(req.params.id);

    if (result instanceof Error) {
      sendErrorResponse({ res, error: result, what: operableEntities.product });
    } else if (!result) {
      console.log("going this way --");
      sendErrorResponse({
        res,
        error: responseMap.idNotFound,
        what: operableEntities.product,
      });
    } else {
      sendFetchResponse({ res, data: result, what: operableEntities.product });
    }
  } catch (error) {
    res.status(400).send({ message: "Error fetching the product" });
  }
}
//
async function deleteProduct(req, res) {
  try {
    const isUsed = await Auction.countDocuments({
      product: req.params.id,
    });

    if (isUsed === 0) {
      const result = await productService.deleteProduct(req.params.id);
      if (result instanceof Error) {
        sendErrorResponse({
          res,
          error: result,
          what: operableEntities.product,
        });
      } else {
        sendDeletionResponse({
          res,
          data: result,
          what: operableEntities.product,
        });
      }
    } else {
      sendErrorResponse({
        res,
        error: responseMap.alreadyUsed,
        what: operableEntities.product,
      });
    }
  } catch (error) {
    res.status(400).send({ message: "Error deleting product" });
  }
}
//
async function updateApprovalByAdmin(req, res) {
  try {
    // console.log("role from updateStatusBySeller : " + req.role);
    const updateResult = await productService.updateApprovalByAdmin({
      id: req.params.id,
      data: req.body,
    });

    if (updateResult instanceof Error) {
      sendErrorResponse({
        res,
        error: updateResult,
        what: operableEntities.product,
      });
    } else {
      sendUpdateResponse({
        res,
        data: updateResult,
        what: operableEntities.product,
      });
    }
  } catch (error) {
    res.status(400).send({ message: "Error updating status" });
  }
}

//
module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  updateApprovalByAdmin,
  getSingleProduct,
};
