const allowedRoles = {
  admin: "ADMIN",
  seller: "SELLER",
  bidder: "BIDDER",
};

const entities = {
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
  [entities.category]: "",
  [entities.product]: "",
  [entities.auction]: "",
  [entities.bid]: "",
  [entities.feedback]: "",
  [entities.bidder]: "",
  [entities.seller]: "",
};

const mapSearchable = {
  [entities.category]: ["name"],
  [entities.product]: ["productName", "productDetail"],
  [entities.auction]: [],
  [entities.bid]: [],
  [entities.feedback]: [],
  [entities.bidder]: [],
  [entities.seller]: [],
};

const mapFilterables = {
  [entities.category]: [],
  [entities.product]: ["category", "status", "adminApproval", "seller"],
  [entities.auction]: ["status", "isFlagged", "timeZone", "seller"],
  [entities.bid]: ["bidder", "auction", "isWinner", "isFlagged"],
  [entities.feedback]: ["auction", "reviewerRole"],
  [entities.profile]: ["role", "isActive"],
  [entities.bidder]: [],
  [entities.seller]: [],
};

module.exports = {
  paginationFields,
  defaultViewLimit,
  mapSearchable,
  mapFilterables,
  defaultSortOrder,
  mapDefaultSortBy,
  entities,
  allowedRoles,
  //
};
