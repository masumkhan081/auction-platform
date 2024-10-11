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
//
async function createProduct(req, res, next) {
  try {
    const { productName, category, productDetail } = req.body;

    let fileUrls = [];
    let fieldName = fieldsMap[operableEntities.product][0].name; // needed looping if were multiple fields
    let maxCount = fieldsMap[operableEntities.product][0].maxCount;
    //
    if (req?.files?.[fieldName]) {
      for (let i = 0; i < req?.files?.[fieldName].length; i++) {
        fileUrls[i] = await uploadHandler({
          what: fieldName,
          file: req.files[fieldName][i],
        });
      }
      console.log(JSON.stringify(fileUrls));
    }

    try {
      const addResult = await Product.create({
        productName,
        category,
        productDetail,
        productImages: [...fileUrls],
      });

      sendCreateResponse({
        res,
        what: operableEntities.product,
        data: addResult,
      });
    } catch (error) {
      for (let i = 0; i < fileUrls.length; i++) {
        removeFile({ fileUrl: fileUrls[i] });
      }
      sendErrorResponse({ res, error, what: operableEntities.product });
    }
  } catch (error) {
    sendErrorResponse({ res, error, what: operableEntities.product });
  }
}
//
async function updateProduct(req, res) {
  try {
    let fileUrls = [];
    let fieldName = fieldsMap[operableEntities.product][0].name; // needed looping if were multiple fields
    //
    const updatable = await Product.findById(req.params.id);
    //
    if (updatable) {
      if (req?.files?.[fieldName]) {
        for (let i = 0; i < req?.files?.[fieldName].length; i++) {
          fileUrls[i] = await uploadHandler({
            what: fieldName,
            file: req.files[fieldName][i],
          });
        }
      }
      //
      const { productName, category, productDetail, productImages } =
        getUpdateFields({
          updatable,
          body: req.body,
          fileUrls,
        });
      //
      const editResult = await Product.findByIdAndUpdate(
        req.params.id,
        {
          productName,
          category,
          productDetail,
          productImages,
        },
        { new: true }
      );
      sendUpdateResponse({
        res,
        what: operableEntities.product,
        data: editResult,
      });
    } else {
      sendErrorResponse({
        res,
        error: responseMap.id_not_found,
        what: operableEntities.product,
      });
    }
  } catch (error) {
    console.log("error cash ... " + error.message);
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
        error: responseMap.id_not_found,
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
        error: responseMap.already_used,
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
function getUpdateFields({ updatable, body, fileUrls }) {
  return {
    productName: body.productName ? body.productName : updatable.productName,
    category: body.category ? body.category : updatable.category,
    productDetail: body.productDetail
      ? body.productDetail
      : updatable.productDetail,
    productImages: fileUrls.length > 0 ? fileUrls : updatable.productImages,
  };
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
