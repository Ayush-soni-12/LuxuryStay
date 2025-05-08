const fs = require("fs");

const deleteFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error(`Error deleting file: ${filePath}`, err.message);
        } else {
            console.log(`File deleted: ${filePath}`);
        }
    });
};

module.exports = { deleteFile };