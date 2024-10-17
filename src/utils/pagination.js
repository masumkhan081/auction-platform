/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */

const {
  defaultViewLimit,
  mapSearchable,
  mapFilterables,
} = require("../config/constants");

function getSearchAndPagination({ query: query, what }) {
  const { search, page, limit, searchBy, sortBy, sortOrder } = query;

  const sortField = sortBy || "createdAt"; // Default to "createdAt" if no sort_by is provided
  const sortDirection = sortOrder || "desc";

  // page-number - pagination field
  const currentPage =
    page === "" ? 1 : page === undefined ? 1 : page < 1 ? 1 : page;

  // limit - pagination field
  const viewLimit =
    limit === ""
      ? defaultViewLimit
      : limit === undefined
      ? defaultViewLimit
      : limit < 1
      ? defaultViewLimit
      : limit;

  // skip  - pagination field
  const viewSkip = viewLimit * (currentPage - 1);

  // what fild to be searched on
  const searchField =
    searchBy === undefined ? "whole" : searchBy === "" ? "whole" : searchBy;

  // what to be searched by
  const searchTerm =
    search === "" ? search : search === undefined ? "" : search;

  let searchConditions = [];
  let filterConditions = {};
  let sortConditions = { [sortField]: sortDirection };
  let filterData;

  // Add filter conditions from mapFilterables
  for (let i = 0; i < mapFilterables[what]?.length; i++) {
    filterData = query[mapFilterables[what][i]];

    if (filterData !== undefined && filterData !== "") {
      filterConditions[mapFilterables[what][i]] = filterData;
    }
  }

  for (let i = 0; i < mapSearchable[what]?.length; i++) {
    const searchableField = mapSearchable[what][i];
    if (searchTerm) {
      if (searchField === "whole") {
        searchConditions.push({
          [searchableField]: { $regex: new RegExp(searchTerm, "i") },
        });
      } else {
        searchConditions.push({
          [searchField]: { $regex: new RegExp(searchTerm, "i") },
        });
      }
    }
  }

  // Combine search conditions with filter conditions
  if (searchConditions.length > 0) {
    filterConditions["$or"] = searchConditions;
  }

  return {
    currentPage,
    searchTerm,
    viewLimit,
    viewSkip,
    sortBy,
    sortOrder,
    filterConditions,
    sortConditions,
  };
}

module.exports = { getSearchAndPagination };
