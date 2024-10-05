const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { operableEntities } = require("../config/constants");
const { promisify } = require("util");
const unlinkAsync = promisify(fs.unlink);
//
const storageMap = {
  productImages: {
    destination: "../../public/product-images",
    max_upload_size: 1024 * 1024 * 3,
    accepted_file_types: /jpeg|jpg|png|gif|webp|svg/,
    save_directory: "public/product-images/",
    unlink_directory: "../../public/product-images",
  },
};

function checkFileType({ file, fileTypes, cb }) {
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Images only! (jpeg, jpg, png, gif, webp, svg)");
  }
}

async function removeFile({ fileUrl }) {
  try {
    const deleteUrl = path.join(__dirname, `../../${fileUrl}`);
    if (fs.existsSync(deleteUrl)) {
      await unlinkAsync(deleteUrl);
    }
  } catch (error) {
    console.log(" ---- " + JSON.stringify(error));
  }
}

module.exports = {
  storageMap,
  removeFile,
};
