const moment = require("moment-timezone");
// Function to convert local time to UTC
function convertToUTC({ time, zone }) {
  return moment.tz(time, zone).utc().format(); // ISO 8601 format
}

module.exports = { convertToUTC };
