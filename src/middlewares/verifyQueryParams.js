const { map_searchables } = require("../config/constants");

const validateQueryParams = (what) => (req, res, next) => {
  // search_by and search params can be present without not-filterable params
  const validParams = [...map_searchables[what], "search_by", "search"];

  // Check if any unexpected parameters are present
  const invalidParams = Object.keys(req.query).filter(
    (key) => !validParams.includes(key)
  );
  if (req.query["search_by"] && !validParams.includes(req.query["search_by"])) {
    invalidParams.push(req.query["search_by"]);
  }
  if (invalidParams.length > 0) {
    return res
      .status(400)
      .json({ error: `Invalid query parameters: ${invalidParams.join(", ")}` });
  }

  // If all parameters are valid, proceed to the next middleware or route handler
  next();
};

module.exports = validateQueryParams;
