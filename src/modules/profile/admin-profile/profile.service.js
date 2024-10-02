/* eslint-disable no-unused-vars */
const { operableEntities } = require("../../../config/constants");
const Profile = require("./profile.model");
const { getSearchAndPagination } = require("../../../utils/pagination");

async function createProfile(data) {
  try {
    const addResult = await Profile.create(data);
    return addResult;
  } catch (error) {
    return error;
  }
}
//
async function getProfiles(query) {
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

    const fetchResult = await Profile.find(filterConditions)
      .sort(sortConditions)
      .skip(viewSkip)
      .limit(viewLimit);

    const total = await Profile.countDocuments(filterConditions);
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
async function updateProfile({ id, data }) {
  try {
    const editResult = await Profile.findByIdAndUpdate(id, data, {
      new: true,
    });
    return editResult;
  } catch (error) {
    return error;
  }
}
//
async function deleteProfile(id) {
  try {
    const deleteResult = await Profile.findByIdAndDelete(id);
    return deleteResult;
  } catch (error) {
    return error;
  }
}

module.exports = {
  createProfile,
  updateProfile,
  deleteProfile,
  getProfiles,
};
