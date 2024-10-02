/* eslint-disable no-unused-vars */
const { operableEntities } = require("../config/constants");
const User = require("../models/users.model");
const { getSearchAndPagination } = require("../utils/pagination");

async function createUser(data) {
  try {
    const addResult = await User.create(data);
    return addResult;
  } catch (error) {
    return error;
  }
}
//
async function getUsers(query) {
  try {
    const {
      currentPage,
      viewLimit,
      viewSkip,
      sortBy,
      sortOrder,
      filterConditions,
      sortConditions,
    } = getSearchAndPagination({ query, what: operableEntities.address });

    const fetchResult = await User.find(filterConditions)
      .sort(sortConditions)
      .skip(viewSkip)
      .limit(viewLimit);

    const total = await User.countDocuments(filterConditions);
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
async function updateUser({ id, data }) {
  try {
    const editResult = await User.findByIdAndUpdate(id, data, {
      new: true,
    });
    return editResult;
  } catch (error) {
    return error;
  }
}
//
async function deleteUser(id) {
  try {
    const deleteResult = await User.findByIdAndDelete(id);
    return deleteResult;
  } catch (error) {
    return error;
  }
}

module.exports = {
  createUser,
  updateUser,
  deleteUser,
  getUsers,
};
