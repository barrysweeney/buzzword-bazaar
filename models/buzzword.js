const mongoose = require("mongoose");
const btoa = require("btoa");

const Schema = mongoose.Schema;

const BuzzwordSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  numberInStock: { type: Number, required: true },
  category: [{ type: Schema.Types.ObjectId, ref: "Category" }],
  img: { data: Buffer, contentType: String },
});

// Virtual for buzzword's URL
BuzzwordSchema.virtual("url").get(function () {
  return "/catalog/buzzword/" + this._id;
});

// Virtual for src of buzzword img
// technique adapted from this article: https://medium.com/@koteswar.meesala/convert-array-buffer-to-base64-string-to-display-images-in-angular-7-4c443db242cd
BuzzwordSchema.virtual("buzzwordImage").get(function () {
  const TYPED_ARRAY = new Uint8Array(this.img.data);
  if (TYPED_ARRAY.length > 0) {
    const TYPED_ARRAY = new Uint8Array(this.img.data);
    const STRING_CHAR = TYPED_ARRAY.reduce((data, byte) => {
      return data + String.fromCharCode(byte);
    }, "");
    const base64String = btoa(STRING_CHAR);
    return `data:${this.img.contentType};base64,${base64String}`;
  } else {
    return "";
  }
});

//Export model
module.exports = mongoose.model("Buzzword", BuzzwordSchema);
