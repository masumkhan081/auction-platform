const productService = require("./product.service");
const httpStatus = require("http-status");

const {
  sendCreateResponse,
  sendDeletionResponse,
  sendErrorResponse,
  sendFetchResponse,
  sendUpdateResponse,
} = require("../../utils/responseHandler");
const { operableEntities } = require("../../config/constants");
const Product = require("./product.model");
const { uploadHandler, fieldsMap } = require("../../utils/uploader");
const { removeFile } = require("../../utils/fileHandle");

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
  const idUpdatableProduct = req.params.id;
  let paths = {
    product_thumbnail: "",
    additional_product_thumbnail: [],
  };
  //
  try {
    const updatableProduct = await Product.findById(idUpdatableProduct);
    if (updatableProduct) {
      const valid = isPatchBodyValid({
        updatable: updatableProduct,
        role: req.role,
        bodyData: req.body,
      });

      // console.log("----- !! \n\n" + JSON.stringify(valid));

      let len = fieldsMap[operableEntities.product].length;
      // console.log("----- !!" + len);
      //
      for (let i = 0; i < len; i++) {
        let fieldName = fieldsMap[operableEntities.product][i].name;
        let maxCount = fieldsMap[operableEntities.product][i].maxCount;
        if (req?.files?.[fieldName]) {
          if (maxCount === 1) {
            paths[fieldName] = await uploadHandler({
              what: fieldName,
              file: req.files[fieldName][0],
            });
            removeFile({ fileUrl: updatableProduct[fieldName] });
          }
          if (maxCount > 1) {
            console.log("maxC > 1");
            for (let i = 0; i < req?.files?.[fieldName].length; i++) {
              let fileUrl = await uploadHandler({
                what: fieldName,
                file: req.files[fieldName][i],
              });
              paths[fieldName][i] = fileUrl;
            }
            for (let i = 0; i < updatableProduct[fieldName]?.length; i++) {
              removeFile({ fileUrl: updatableProduct[fieldName][i] });
            }
          }
        }
      }

      console.log(
        "valid: " + JSON.stringify(paths["additional_product_thumbnail"])
      );

      const editResult = await Product.findByIdAndUpdate(
        idUpdatableProduct,
        {
          ...valid,
          product_thumbnail:
            paths["product_thumbnail"].length > 0
              ? paths["product_thumbnail"]
              : updatableProduct.product_thumbnail,
          additional_product_thumbnail:
            paths["additional_product_thumbnail"].length > 0
              ? paths["additional_product_thumbnail"]
              : updatableProduct.additional_product_thumbnail,
        },
        { new: true }
      );

      sendUpdateResponse({
        res,
        what: operableEntities.product,
        data: editResult,
      });
    } else {
      res.status(404).send({
        success: false,
        status: 404,
        message: "Id not found",
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
    } else {
      sendFetchResponse({ res, data: result, what: operableEntities.product });
    }
  } catch (error) {
    res.status(400).send({ message: "Error fetching single product" });
  }
}
//
async function deleteProduct(req, res) {
  try {
    const result = await productService.deleteProduct(req.params.id);
    if (result instanceof Error) {
      sendErrorResponse({ res, error: result, what: operableEntities.product });
    } else {
      sendDeletionResponse({
        res,
        data: result,
        what: operableEntities.product,
      });
    }
  } catch (error) {
    res.status(400).send({ message: "Error deleting product" });
  }
}

async function updateStatusBySeller(req, res, next) {
  try {
    console.log("role from updateStatusBySeller : " + req.role);
    const updatableId = req.params.id;
    const { is_active } = req.body;
    const existingProduct = await Product.findById(updatableId);
    //
    if (existingProduct) {
      if (is_active === true || is_active === false) {
        const editResult = await Product.findByIdAndUpdate(
          updatableId,
          {
            is_active,
          },
          { new: true }
        );
        sendUpdateResponse({
          res,
          what: operableEntities.product,
          data: editResult,
        });
      } else {
        res
          .status(400)
          .send({ message: "Invalid request for change of status" });
      }
    } else {
      res.status(400).send({ message: "Id not found" });
    }
  } catch (error) {
    res.status(400).send({ message: "Error updating status" });
  }
}

async function updateApprovalByAdmin(req, res) {
  try {
    // console.log("role from updateStatusBySeller : " + req.role);
    const updateResult = productService.updateApprovalByAdmin({
      id,
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
  updateStatusBySeller,
  getSingleProduct,
};
