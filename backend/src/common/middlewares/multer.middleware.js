import multer from "multer";
import { dirname, normalize, relative, resolve } from "node:path";
import { fileFilter } from "../utils/file.js";
import { BadRequestError } from "../exceptions/app.exception.js";
import { FILE_MIME_TYPES } from "../enums/file.enum.js";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

const FOLDER_NAME = "uploads";

const dist = resolve(FOLDER_NAME);

const storage = multer.memoryStorage();

export const multerInstance = multer({ storage });

function getFilePath({
  fieldname,
  originalname,
  userId,
  currCount,
  ext,
  renameFiles,
}) {
  const fileName = renameFiles
    ? `${fieldname}-${currCount}.${ext}`
    : originalname;

  const fileFullPath = normalize(`${dist}/${userId}/${fieldname}/${fileName}`);

  const currDir = resolve();
  const filePath = relative(currDir, fileFullPath);

  return { filePath, fileFullPath };
}

async function processFiles({
  files,
  allowedTypes,
  userId = randomUUID(),
  renameFiles,
}) {
  const paths = {};

  for (const file of files) {
    const { buffer, originalname, fieldname } = file;

    const { isValid, ext } = await fileFilter(buffer, allowedTypes);

    if (!isValid) {
      throw BadRequestError(
        `Invalid file type ${originalname}${allowedTypes.length > 0 ? ` Supported Types: ${allowedTypes.join(", ")}` : ""}`,
      );
    }

    const fieldPaths = paths[fieldname] ?? [];
    const currCount = fieldPaths.length + 1;

    const { filePath, fileFullPath } = getFilePath({
      fieldname,
      originalname,
      userId,
      currCount,
      ext,
      renameFiles,
    });

    await mkdir(dirname(fileFullPath), { recursive: true });
    await writeFile(fileFullPath, buffer);

    if (!paths[fieldname]) {
      paths[fieldname] = [];
    }

    paths[fieldname].push(filePath);
  }

  return { paths, dist: userId };
}

export function upload(
  multerMiddleWare = multerInstance.array("attachments"),
  fileType = "",
  renameFiles = true,
) {
  return function (req, res, next) {
    multerMiddleWare(req, res, async (err) => {
      if (err) {
        return next(err);
      }

      if (!req.file && !req.files) {
        req.paths = {};

        return next();
      }

      const files = [];
      if (req.file) {
        files.push(req.file);
      } else {
        if (Array.isArray(req.files)) {
          files.push(...req.files);
        } else {
          Object.values(req.files).forEach((fileArray) => {
            files.push(...fileArray);
          });
        }
      }

      if (files.length === 0) {
        req.paths = {};

        return next();
      }

      try {
        const { paths, dist } = await processFiles({
          files,
          allowedTypes: FILE_MIME_TYPES[fileType] ?? [],
          userId: req.user?.id,
          renameFiles,
        });

        req.paths = paths;
        req.dist = `${FOLDER_NAME}/${dist}`;

        return next();
      } catch (err) {
        return next(err);
      }
    });
  };
}
