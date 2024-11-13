/* eslint-disable no-unused-vars */
const { entities } = require("../../config/constants");
const Feedback = require("./feedback.model");
const { getSearchAndPagination } = require("../../utils/pagination");

//
const createFeedback = async (data) => Feedback.create(data);

const getSingleFeedback = async (updatableId) =>
  await Feedback.findById(updatableId);

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
    } = getSearchAndPagination({ query, what: entities.feedback });

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
const updateFeedback = async ({ id, data }) =>
  Feedback.findByIdAndUpdate(id, data, { new: true });

//
const deleteFeedback = (id) => Feedback.findByIdAndDelete(id);

module.exports = {
  createFeedback,
  deleteFeedback,
  getFeedbacks,
  getSingleFeedback,
  updateFeedback,
};
