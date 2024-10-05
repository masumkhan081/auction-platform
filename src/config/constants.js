const allowedRoles = {
  admin: "ADMIN",
  seller: "SELLER",
  bidder: "BIDDER",
};

const operableEntities = {
  category: "Category",
  product: "Products",
  auction: "Auction",
};

const paginationFields = ["page", "limit", "sortBy", "sortOrder"];
const defaultViewLimit = 20;
const defaultSortOrder = "desc";

// may be changed based on the outcome expected
const map_default_sort_by = {
  [operableEntities.category]: "",
  [operableEntities.product]: "",
  [operableEntities.auction]: "",
};

const map_searchables = {
  [operableEntities.category]: ["name"],
  [operableEntities.product]: ["name", "category"],
  [operableEntities.auction]: [],
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
