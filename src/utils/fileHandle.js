const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { entities } = require("../config/constants");
const { promisify } = require("util");
const unlinkAsync = promisify(fs.unlink);
const upload = multer({ dest: "../../public/" });
//
const storageMap = {
  productImages: {
    destination: "../../public/product-images",
    maxUploadSize: 1024 * 1024 * 3,
    fileTypes: /jpeg|jpg|png|gif|webp|svg/,
    saveDirectory: "public/product-images/",
    unlinkDirectory: "../../public/product-images",
  },
};
//
const fieldsMap = {
  [entities.product]: [
    { name: "productImages", maxCount: 3, required: true },
  ],
};
//
const uploadProductImages = upload.fields(fieldsMap[entities.product]);
//
async function uploadHandler({ files, fieldName }) {
  if (!files || files.length === 0) return []; // Return empty array if no files to upload

  const fileUrls = [];
  const { destination, fileTypes } = storageMap[fieldName];
  const uploadDir = path.join(__dirname, destination);

  // Ensure the upload directory exists
  await fs.promises.mkdir(uploadDir, { recursive: true }); // Create directory if it doesn't exist

  // Validate file types first
  const invalidFiles = files.filter(
    (file) => !checkFileType({ file, fileTypes })
  );

  if (invalidFiles.length > 0) {
    console.error(
      "Error: One or more files have an invalid type. Accepted types: jpeg, jpg, png, gif, webp, svg"
    );
    throw new Error("Invalid file types detected.");
  }

  // Proceed with reading and writing files since all file types are valid
  for (const file of files) {
    try {
      const readData = await fs.promises.readFile(file.path); // Read file data
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const basename = path.basename(file.originalname, ext);
      const newFilePath = path.join(
        storageMap[fieldName].saveDirectory,
        `${basename}-${timestamp}${ext}`
      );

      await fs.promises.writeFile(newFilePath, readData); // Write file to the new path
      fileUrls.push(newFilePath); // Add the file URL to the array
    } catch (error) {
      console.error("File upload error:", error.message);
      await Promise.all(fileUrls.map((url) => removeFile({ fileUrl: url })));
      throw new Error(
        "File upload failed. All uploaded files have been removed."
      );
    }
  }

  return fileUrls; // Return successfully uploaded file URLs
}

function checkFileType({ file, fileTypes }) {
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);

  return mimetype && extname; // Return true if both checks pass, false otherwise
}

async function removeFile({ fileUrl }) {
  try {
    const deleteUrl = path.join(__dirname, `../../${fileUrl}`);
    if (fs.existsSync(deleteUrl)) {
      await unlinkAsync(deleteUrl);
    }
  } catch (error) {
    console.log(" removeFile: " + error.message);
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
