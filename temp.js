const moment = require("moment-timezone");

const arr = moment.tz.names();

const data = {
  name: "name",
  age: 22,
};
console.log({ ...data, age: 29, name: "masum" });
