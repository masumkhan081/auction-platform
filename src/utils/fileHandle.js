const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { operableEntities } = require("../config/constants");
const { promisify } = require("util");
const unlinkAsync = promisify(fs.unlink);
const upload = multer({ dest: "../../public/" });
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
//
const fieldsMap = {
  [operableEntities.product]: [
    { name: "productImages", maxCount: 3, required: true },
  ],
};
//
const uploadProductImages = upload.fields(fieldsMap[operableEntities.product]);
//
async function uploadHandler({ type, what, file }) {
  try {
    const uploadDir = path.join(__dirname, storageMap[what].destination);
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
      }
    } catch (err) {
      console.log("inner catch");
      console.error(err);
    }
    const readData = fs.readFileSync(file.path);
    // unique name generation
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const newFilePath = `${storageMap[what].save_directory}${basename}-${timestamp}${ext}`;
    //
    const writeData = fs.writeFileSync(newFilePath, readData);
    return newFilePath;
  } catch (error) {
    console.log("uploadHandler: error processing file: " + error.message);
    throw new Error("File upload failed");
  }
}
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
//
module.exports = {
  storageMap,
  removeFile,
  uploadHandler,
  fieldsMap,
  uploadProductImages,
};
