/* eslint-disable no-unused-vars */
const { entities } = require("../../config/constants");
const Profile = require("./profile.model");
const User = require("../auth/auth.model");
const { getSearchAndPagination } = require("../../utils/pagination");
//
const getProfileDetail = async (userID) =>
  User.findById(userID).select("-password -isActive").populate("profile");
//
const updateProfile = async ({ id, data }) =>
  Profile.findByIdAndUpdate(id, data, { new: true });
//
const deactivateProfile = async ({ id, role }) =>
  User.findOneAndUpdate(
    { _id: id, role }, // Use _id for querying by user ID
    { isActive: false },
    { new: true }
  );
//
async function getList(query) {
  try {
    let {
      currentPage,
      viewLimit,
      viewSkip,
      sortBy,
      sortOrder,
      filterConditions,
    } = getSearchAndPagination({ query, what: entities.profile });

    const fetchResult = await User.find(filterConditions)
      .skip(viewSkip)
      .limit(viewLimit)
      .populate("profile")
      .exec();

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
    console.log(" Service: getList: " + error.message);
    return error;
  }
}

module.exports = {
  getProfileDetail,
  updateProfile,
  deactivateProfile,
  getList,
};
