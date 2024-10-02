const multer = require("multer");
const upload = multer({ dest: "../../public/" });
const { storageMap } = require("./fileHandle");
const { operableEntities } = require("../config/constants");
const fs = require("fs");
const path = require("path");

const fieldsMap = {
  [operableEntities.product]: [
    { name: "product_thumbnail", maxCount: 1, required: true },
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
    res.status(400).send({ message: "error processing file" });
  }
}

module.exports = {
  uploadHandler,
  fieldsMap,
  uploadProductImages,
};
