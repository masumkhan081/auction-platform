/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */

const { defaultViewLimit, map_searchables } = require("../config/constants");

function getSearchAndPagination({ query: query, what }) {
  const { search, page, limit, search_by, sort_by, sort_order } = query;

  // sorting data with a particular field and order or by taking prefined defaults in this regard
  const sortBy = sort_by || "createdAt";
  const sortOrder = sort_order || "desc";

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
  const searchBy =
    search_by === undefined ? "whole" : search_by === "" ? "whole" : search_by;

  // what to be searched by
  const searchTerm =
    search === "" ? search : search === undefined ? "" : search;

  let searchConditions = [];
  let filterConditions = {};
  let sortConditions = { [sortBy]: sortOrder };
  let filterData;

  for (let i = 0; i < map_searchables[what]?.length; i++) {
    filterData = query[map_searchables[what][i]];
    if (filterData !== undefined && filterData !== "") {
      filterConditions[map_searchables[what][i]] = filterData;
    } else if (searchTerm) {
      if (searchBy === "whole") {
        console.log("whole");
        searchConditions.push({
          [map_searchables[what][i]]: { $regex: new RegExp(searchTerm, "i") },
        });
      } else {
        searchConditions.push({
          [searchBy]: { $regex: new RegExp(searchTerm, "i") },
        });
      }
    }
  }

  searchConditions.length > 0
    ? (filterConditions["$or"] = searchConditions)
    : searchConditions;

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
