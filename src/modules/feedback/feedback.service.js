/* eslint-disable no-unused-vars */
const { operableEntities } = require("../../config/constants");
const Feedback = require("./feedback.model");
const { getSearchAndPagination } = require("../../utils/pagination");

//

async function getSingleFeedback(updatableId) {
  try {
    const getResult = await Feedback.findById(updatableId);
    return getResult;
  } catch (error) {
    return error;
  }
}

async function getFeedbacks(query) {
  try {
    const {
      currentPage,
      viewLimit,
      viewSkip,
      sortBy,
      sortOrder,
      filterConditions,
      sortConditions,
    } = getSearchAndPagination({ query, what: operableEntities.feedback });

    const fetchResult = await Feedback.find(filterConditions)
      .sort(sortConditions)
      .skip(viewSkip)
      .limit(viewLimit);

    const total = await Feedback.countDocuments(filterConditions);
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
async function updateFeedback({ id, data }) {
  try {
    const { name, description } = data;
    const updateResult = await Feedback.findByIdAndUpdate(
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
async function deleteFeedback(id) {
  try {
    const deleteResult = await Feedback.findByIdAndDelete(id);
    return deleteResult;
  } catch (error) {
    return error;
  }
}

module.exports = {
  deleteFeedback,
  getFeedbacks,
  getSingleFeedback,
  updateFeedback,
};
