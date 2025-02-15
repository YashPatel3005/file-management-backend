import mongoose from "mongoose";
import { setCurrentTimestamp } from "../helpers/dateFunction.helper.js";

const fileSchema = new mongoose.Schema({
  fileName: {
    type: String,
    trim: true,
    required: true,
  },
  path: {
    type: String,
    trim: true,
    default: null,
  },
  folderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folders",
  },
  mimeType: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Number,
    default: setCurrentTimestamp,
  },
  updatedAt: {
    type: Number,
    default: setCurrentTimestamp,
  },
});

const File = mongoose.model("files", fileSchema);

export default File;
