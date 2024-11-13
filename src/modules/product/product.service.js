const { entities } = require("../../config/constants");
const Product = require("./product.model");
const { getSearchAndPagination } = require("../../utils/pagination");
const {} = require("../../utils/responseHandler");

async function createProduct(data) {
  const addResult = await Product.create(data);
  return addResult;
}
//

const getSingleProduct = (id) => Product.findById(id).populate("category");

async function getProducts(query) {
  try {
    const {
      currentPage,
      viewLimit,
      viewSkip,
      sortBy,
      sortOrder,
      filterConditions,
      sortConditions,
    } = getSearchAndPagination({ query, what: entities.product });

    const fetchResult = await Product.find(filterConditions)
      .sort(sortConditions)
      .skip(viewSkip)
      .limit(viewLimit)
      .populate("category");

    const total = await Product.countDocuments(filterConditions);

    return {
      meta: {
        total,
        limit: viewLimit,
        page: currentPage,
        skip: viewSkip,
        sortBy,
        sortOrder,
      },
      data: fetchResult,
    };
  } catch (error) {
    console.log("service: getProducts: " + error.message);
    return error;
  }
}
//
const updateProduct = async ({ id, data }) =>
  Product.findByIdAndUpdate(id, data, {
    new: true,
  });

//
const deleteProduct = async (id) => await Product.findByIdAndDelete(id);

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getProducts,
  getSingleProduct,
};
