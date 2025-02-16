import constants from "../../../config/constants.js";
import Folder from "../../models/folder.model.js";
import path from "path";
import fs from "fs/promises";
import moment from "moment";
import File from "../../models/file.modal.js";
import { io } from "../../index.js";

/**
 * Upload a file
 *
 * @param {folderId, file} req
 */
export const uploadFile = async (req, res) => {
  try {
    const { folderId } = req.body;

    const socketId = req.headers["socket-id"];

    let folderData;

    if (folderId) {
      folderData = await Folder.findById(folderId).select("path");

      if (!folderData) {
        return res.status(404).json({
          status: constants.STATUS_CODE.NOT_FOUND,
          message: "Folder not found",
          error: true,
          data: {},
        });
      }
    }

    if (!req.file) {
      return res.status(500).send({
        status: constants.STATUS_CODE.FAIL,
        message: "No file uploaded",
        error: true,
        data: {},
      });
    }

    if (!constants.ALLOWED_FILE_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({
        status: constants.STATUS_CODE.FAIL,
        message: "Unsupported file type",
        error: true,
        data: {},
      });
    }

    const destinationPath = path.join(
      __dirname,
      "../localstorage",
      folderData ? folderData.path.toString() : ""
    );

    await fs.mkdir(destinationPath, { recursive: true });

    const filename = `${moment().format("x")}_${req.file.originalname}`;
    const filePath = path.join(destinationPath, filename);
    const fileSize = req.file.size;
    let uploadedSize = 0;
    const chunkSize = 1024 * 64; // 64 KB chunk size

    const fileHandle = await fs.open(filePath, "w");

    try {
      for (let i = 0; i < req.file.buffer.length; i += chunkSize) {
        const chunk = req.file.buffer.slice(i, i + chunkSize);
        await fileHandle.write(chunk);
        uploadedSize += chunk.length;

        // Send real-time progress using WebSocket
        const progress = Math.round((uploadedSize / fileSize) * 100);
        io.to(socketId).emit("uploadProgress", { progress });

        await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate network delay
      }

      await fileHandle.close();

      const file = await File.create({
        fileName: filename,
        folderId: folderId,
        mimeType: req.file.mimetype,
        path: folderData ? folderData.path.toString() : "",
      });

      io.to(socketId).emit("uploadProgress", { progress: 100, file });

      return res.status(200).send({
        status: constants.STATUS_CODE.SUCCESS,
        message: "File has been uploaded successfully.",
        error: false,
        data: file,
      });
    } catch (error) {
      console.error("Error writing file:", error);
      io.to(socketId).emit("uploadError", { error: "File upload failed" });

      return res.status(500).send({
        status: constants.STATUS_CODE.FAIL,
        message: "Something went wrong",
        error: true,
        data: {},
      });
    }
  } catch (error) {
    console.log("Error while uploading file", error);

    return res.status(500).send({
      status: constants.STATUS_CODE.FAIL,
      message: "Something went wrong",
      error: true,
      data: {},
    });
  }
};

/**
 * Open Selected File
 *
 * @param {id} params fileId
 */
export const getSelectedFile = async (req, res) => {
  try {
    const fileId = req.params.id;

    const fileData = await File.findOne({ _id: fileId }).select(
      "fileName path"
    );

    if (!fileData) {
      return res.status(404).json({
        status: constants.STATUS_CODE.NOT_FOUND,
        message: "File not found",
        error: true,
        data: {},
      });
    }

    const filePath = path.join(
      __dirname,
      "../localstorage",
      fileData.path.toString(),
      fileData.fileName.toString()
    );

    return res.download(filePath);
  } catch (error) {
    console.log("Error while get selected file", error);

    return res.status(500).send({
      status: constants.STATUS_CODE.FAIL,
      message: "Something went wrong",
      error: true,
      data: {},
    });
  }
};
