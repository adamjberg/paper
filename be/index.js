const aws = require('aws-sdk')
const express = require('express')
const multer = require('multer')
const multerS3 = require('multer-s3')

const app = express();
const s3 = new aws.S3({ endpoint: "https://sfo3.digitaloceanspaces.com" })

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'xyzdigital',
    metadata: function (req, file, cb) {
      console.log(file)
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      console.log(file)
      cb(null, Date.now().toString())
    }
  })
})

app.post("/api/drawings", upload.single('drawing'), function(req, res, next) {
  console.log("Posted?")
  console.log(req.file)
  return res.json({
    success: true
  })
})

app.use(express.static("../vanilla"));

app.listen(3001, function () {
  console.log('Server listening on port 3001.');
});