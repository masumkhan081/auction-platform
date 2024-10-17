const { mapSearchable } = require("../config/constants");
//
//  not used
const validateQueryParams = (what) => (req, res, next) => {
  // searchBy and search params can be present without not-filterable params
  const validParams = [...mapSearchable[what], "searchBy", "search"];

  // Check if any unexpected parameters are present
  const invalidParams = Object.keys(req.query).filter(
    (key) => !validParams.includes(key)
  );
  if (req.query["searchBy"] && !validParams.includes(req.query["searchBy"])) {
    invalidParams.push(req.query["searchBy"]);
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
