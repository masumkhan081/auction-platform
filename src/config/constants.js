const allowedRoles = {
  admin: "ADMIN",
  seller: "SELLER",
  bidder: "BIDDER",
};

const operableEntities = {
  category: "Category",
  product: "Product",
  auction: "Auction",
  bid: "Bid",
  feedback: "Feedback",
};

const paginationFields = ["page", "limit", "sortBy", "sortOrder"];
const defaultViewLimit = 20;
const defaultSortOrder = "desc";

// may be changed based on the outcome expected
const map_default_sort_by = {
  [operableEntities.category]: "",
  [operableEntities.product]: "",
  [operableEntities.auction]: "",
  [operableEntities.bid]: "",
  [operableEntities.feedback]: "",
};

const map_searchables = {
  [operableEntities.category]: ["name"],
  [operableEntities.product]: ["name", "category"],
  [operableEntities.auction]: [],
  [operableEntities.bid]: [],
  [operableEntities.feedback]: ["reviewer","auction"],
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
