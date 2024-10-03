/* eslint-disable no-unused-vars */

const allowedRoles = {
  admin: "ADMIN",
  seller: "SELLER",
  user: "BUYER",
};

const operableEntities = {
  product: "Products",
  auction: "Auction",
};

const paginationFields = ["page", "limit", "sortBy", "sortOrder"];
const defaultViewLimit = 20;
const defaultSortOrder = "desc";

// may be changed based on the outcome expected
const map_default_sort_by = {
  [operableEntities.product]: "products",
  [operableEntities.auction]: "product_category",
};

const map_searchables = {
  [operableEntities.product]: ["name", "brand", "color", "category"],
  [operableEntities.auction]: ["name"],
};

module.exports = {
  paginationFields,
  defaultViewLimit,
  map_searchables,
  defaultSortOrder,
  map_default_sort_by,
  operableEntities,
  allowedRoles,
  //
};
