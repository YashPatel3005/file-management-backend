import constants from "../../../config/constants.js";
import Folder from "../../models/folder.model.js";
import path from "path";
import fs from "fs/promises";
import mongoose from "mongoose";
import File from "../../models/file.modal.js";

/**
 * Create a new folder
 *
 * @param {name, description, parentFolderId} req
 * @param {*} res
 * @returns
 */
export const createFolder = async (req, res) => {
  try {
    const reqBody = req.body;

    let parentFolder;
    if (reqBody.parentFolderId) {
      parentFolder = await Folder.findById(reqBody.parentFolderId);

      if (!parentFolder) {
        return res.status(400).json({
          status: constants.STATUS_CODE.FAIL,
          message: "Parent folder not found",
          error: true,
          data: {},
        });
      }
    }

    const folder = await Folder.create(reqBody);

    let folderPath = "";
    if (parentFolder) {
      folderPath = path.join(parentFolder.path, folder.id);
    } else {
      folderPath = folder.id;
    }

    folder.path = folderPath;
    await folder.save();

    const exactFolderPath = parentFolder
      ? path.join(__dirname, "../localstorage", folderPath)
      : path.join(__dirname, "../localstorage", folderPath);

    await fs.mkdir(exactFolderPath, { recursive: true });

    return res.status(200).json({
      message: "Folder created successfully.",
      status: constants.STATUS_CODE.SUCCESS,
      error: false,
      data: folder,
    });
  } catch (error) {
    console.log("Error while creating folder", error);

    return res.status(500).json({
      status: constants.STATUS_CODE.FAIL,
      message: "Something went wrong",
      error: true,
      data: {},
    });
  }
};

/**
 * Update folder
 *
 * @param {id}
 */
export const updateFolder = async (req, res) => {
  try {
    const folderId = req.params.id;

    const reqBody = req.body;

    const folder = await Folder.findByIdAndUpdate(folderId, reqBody, {
      new: true,
    });

    if (!folder) {
      return res.status(404).json({
        status: constants.STATUS_CODE.NOT_FOUND,
        message: "Folder not found",
        error: true,
        data: {},
      });
    }

    return res.status(200).json({
      message: "Folder updated successfully.",
      status: constants.STATUS_CODE.SUCCESS,
      error: false,
      data: folder,
    });
  } catch (error) {
    console.log("Error while updating folder", error);

    return res.status(500).json({
      status: constants.STATUS_CODE.FAIL,
      message: "Something went wrong",
      error: true,
      data: {},
    });
  }
};

/**
 * Delete a folder
 *
 * @param {folderId} params
 */
export const deleteFolder = async (req, res) => {
  try {
    const folderId = req.params.id;

    const foldersToDelete = await Folder.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(folderId) },
      },
      {
        $graphLookup: {
          from: "folders",
          startWith: "$_id",
          connectFromField: "_id",
          connectToField: "parentFolderId",
          as: "subfolders",
        },
      },
    ]);

    if (!foldersToDelete.length) {
      return res.status(404).json({
        status: constants.STATUS_CODE.FAIL,
        message: "Folder not found",
        error: true,
        data: {},
      });
    }

    const folderIds = [
      folderId,
      ...foldersToDelete[0].subfolders.map((folder) => folder._id),
    ];

    await Folder.deleteMany({ _id: { $in: folderIds } });
    await File.deleteMany({ folderId: { $in: folderIds } });

    const folderPath = path.join(
      __dirname,
      "../localstorage",
      foldersToDelete[0].path
    );
    await fs.rm(folderPath, { recursive: true, force: true });

    return res.status(200).json({
      message: "Folder deleted successfully.",
      status: constants.STATUS_CODE.SUCCESS,
      error: false,
      data: {},
    });
  } catch (error) {
    console.log("Error while deleting folder", error);

    return res.status(500).json({
      status: constants.STATUS_CODE.FAIL,
      message: "Something went wrong",
      error: true,
      data: {},
    });
  }
};

/**
 * Get folders/files structure
 */
export const getFoldersAndFiles = async (req, res) => {
  try {
    const sortBy = req.query.sortBy;

    let field, value;
    if (sortBy) {
      const parts = sortBy.split(":");
      field = parts[0];
      parts[1] === "desc" ? (value = -1) : (value = 1);
    } else {
      (field = "createdAt"), (value = 1);
    }

    const pageOptions = {
      page: parseInt(req.query.page) || constants.PAGE,
      limit: parseInt(req.query.limit) || constants.LIMIT,
    };
    let page = pageOptions.page;
    let limit = pageOptions.limit;

    const query = { parentFolderId: null };

    if (req.query.name) {
      query.name = new RegExp(req.query.name, "i");
    }

    if (req.query.description) {
      query.description = new RegExp(req.query.description, "i");
    }

    if (req.query.createdAt) {
      query.createdAt = req.query.createdAt;
    }

    const total = await Folder.countDocuments(query);

    const folders = await Folder.find(query)
      .sort({ [field]: value })
      .skip((page - 1) * limit)
      .limit(limit)
      .collation({ locale: "en" });

    const totalFolders = await Folder.countDocuments();

    const totalFiles = await File.countDocuments();

    return res.status(200).json({
      message: "Folders fetched successfully.",
      status: constants.STATUS_CODE.SUCCESS,
      error: false,
      data: {
        folders,
        page,
        limit,
        total,
        statistics: { totalFolders, totalFiles },
      },
    });
  } catch (error) {
    console.log("Error while getting folder list", error);

    return res.status(500).json({
      status: constants.STATUS_CODE.FAIL,
      message: "Something went wrong",
      error: true,
      data: {},
    });
  }
};

/**
 * Get a list of sub folders and files by id
 *
 * @param {*folderId} params
 */
export const getFoldersAndFilesById = async (req, res) => {
  try {
    const folderId = req.params.id;

    const folders = await Folder.find({ parentFolderId: folderId });

    const files = await File.find({ folderId: folderId });

    return res.status(200).json({
      message: "Sub Folders fetched successfully.",
      status: constants.STATUS_CODE.SUCCESS,
      error: false,
      data: { folders, files },
    });
  } catch (error) {
    console.log("Error while getting folder/files list", error);

    return res.status(500).json({
      status: constants.STATUS_CODE.FAIL,
      message: "Something went wrong",
      error: true,
      data: {},
    });
  }
};
