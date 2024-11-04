/* eslint-disable no-unused-vars */
const { operableEntities } = require("../../config/constants");
const Category = require("./category.model");
const { getSearchAndPagination } = require("../../utils/pagination");
//

async function createCategory(data) {
  const addResult = await Category.create(data);
  return addResult;
}

async function getSingleCategory(updatableId) {
  return Category.findById(updatableId);
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
}
//
async function deleteCategory(id) {
  return await Category.findByIdAndDelete(id);
}

module.exports = {
  createCategory,
  deleteCategory,
  getCategories,
  getSingleCategory,
  updateCategory,
};
