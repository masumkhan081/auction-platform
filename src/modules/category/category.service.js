/* eslint-disable no-unused-vars */
const { operableEntities } = require("../../config/constants");
const Category = require("./category.model");
const { getSearchAndPagination } = require("../../utils/pagination");

//

async function getSingleCategory(updatableId) {
  try {
    const getResult = await Category.findById(updatableId);
    return getResult;
  } catch (error) {
    return error;
  }
}

async function getCategories(query) {
  try {
    const {
      currentPage,
      viewLimit,
      viewSkip,
      sortBy,
      sortOrder,
      filterConditions,
      sortConditions,
    } = getSearchAndPagination({ query, what: operableEntities.category });

    const fetchResult = await Category.find(filterConditions)
      .sort(sortConditions)
      .skip(viewSkip)
      .limit(viewLimit);

    const total = await Category.countDocuments(filterConditions);
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
    return error;
  }
}
//
async function updateCategory({ id, data }) {
  try {
    const { name, description } = data;
    const updateResult = await Category.findByIdAndUpdate(
      id,
      {
        name,
        description,
      },
      { new: true }
    );
    return updateResult;
  } catch (error) {
    return error;
  }
}
//
async function deleteCategory(id) {
  try {
    const deleteResult = await Category.findByIdAndDelete(id);
    return deleteResult;
  } catch (error) {
    return error;
  }
}

module.exports = {
  deleteCategory,
  getCategories,
  getSingleCategory,
  updateCategory,
};
