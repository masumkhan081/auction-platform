/* eslint-disable no-unused-vars */
const { operableEntities } = require("../../config/constants");
const Profile = require("./profile.model");
const User = require("../auth/auth.model");
const { getSearchAndPagination } = require("../../utils/pagination");
//

async function getProfileDetail(userID) {
  try {
    const profileInfo = await User.findById(userID)
      .select("-password -isActive")
      .populate("profile");
     
    return profileInfo;
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
    console.log("service: updateProfile: " + error.message);
    return error;
  }
}
//
async function deactivateProfile({ id, role }) {
  try {
    const deleteResult = await User.findOneAndUpdate(
      { id, role },
      { isActive: false },
      { new: true }
    );
    return deleteResult;
  } catch (error) {
    return error;
  }
}
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
      sortConditions,
    } = getSearchAndPagination({ query, what: operableEntities.profile });

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
