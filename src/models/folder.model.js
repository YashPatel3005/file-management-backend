import mongoose from "mongoose";
import { setCurrentTimestamp } from "../helpers/dateFunction.helper.js";
import { string } from "zod";

const folderSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: true,
  },
  description: {
    type: String,
    trim: true,
    default: null,
  },
  parentFolderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Folders",
  },
  path: {
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

const Folder = mongoose.model("folders", folderSchema);

export default Folder;
