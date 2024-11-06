 

function validateData({ schema, data }) {
  try {
    const valid = schema.safeParse(data);
    if (valid.success) {
      return { success: true };
    }
    let messages = {};
    let issues = valid.error.issues;

    // console.log("\n: issues: "+JSON.stringify(issues));

    for (let i = 0; i < issues.length; i++) {
      messages[issues[i].path[0]] = issues[i].message;
    }
    // console.log("messages :  " + JSON.stringify(messages));

    return {
      success: false,
      message: "Invalid data",
      messages,
    };
  } catch (error) {
    return {
      success: false,
    };
  }
}

module.exports = validateData;
