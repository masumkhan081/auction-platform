/* eslint-disable no-unused-vars */
const { operableEntities } = require("../../../config/constants");
const Customer = require("./customer.model");
const { getSearchAndPagination } = require("../../../utils/pagination");
const {
  updateContactUs,
} = require("../../legal-pages/contact-us/contactUs.controller");
//
async function createCustomer(data) {
  try {
    const addResult = await Customer.create(data);
    return addResult;
  } catch (error) {
    return error;
  }
}
//
async function getCustomers(query) {
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

    const fetchResult = await Customer.find(filterConditions)
      .sort(sortConditions)
      .skip(viewSkip)
      .limit(viewLimit);

    const total = await Customer.countDocuments(filterConditions);
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
async function updateCustomer({ id, data }) {
  try {
    const editResult = await Customer.findByIdAndUpdate(id, data, {
      new: true,
    });
    return editResult;
  } catch (error) {
    return error;
  }
}
//
async function deleteCustomer(id) {
  try {
    const deleteResult = await Customer.findByIdAndDelete(id);
    return deleteResult;
  } catch (error) {
    return error;
  }
}
//
module.exports = {
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomers,
};
