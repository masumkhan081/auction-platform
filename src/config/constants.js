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
  profile: "Profile",
  bidder: "Bidder",
  seller: "Seller",
};

const paginationFields = ["page", "limit", "sortBy", "sortOrder"];
const defaultViewLimit = 20;
const defaultSortOrder = "desc";

// may be changed based on the outcome expected
const mapDefaultSortBy = {
  [operableEntities.category]: "",
  [operableEntities.product]: "",
  [operableEntities.auction]: "",
  [operableEntities.bid]: "",
  [operableEntities.feedback]: "",
  [operableEntities.bidder]: "",
  [operableEntities.seller]: "",
};

const mapSearchable = {
  [operableEntities.category]: ["name"],
  [operableEntities.product]: ["productName", "productDetail"],
  [operableEntities.auction]: [],
  [operableEntities.bid]: [],
  [operableEntities.feedback]: [],
  [operableEntities.bidder]: [],
  [operableEntities.seller]: [],
};

const mapFilterables = {
  [operableEntities.category]: [],
  [operableEntities.product]: ["category", "status", "adminApproval","seller"],
  [operableEntities.auction]: ["status", "isFlagged", "timeZone","seller"],
  [operableEntities.bid]: ["bidder", "auction", "isWinner", "isFlagged"],
  [operableEntities.feedback]: ["reviewer", "auction"],
  [operableEntities.profile]: ["role", "isActive"],
  [operableEntities.bidder]: [],
  [operableEntities.seller]: [],
};

module.exports = {
  paginationFields,
  defaultViewLimit,
  mapSearchable,
  mapFilterables,
  defaultSortOrder,
  mapDefaultSortBy,
  operableEntities,
  allowedRoles,
  //
};
