import multer from "multer";
import { dirname, normalize, relative, resolve } from "node:path";
import { fileFilter } from "../utils/file.js";
import { BadRequestError } from "../exceptions/app.exception.js";
import { FILE_MIME_TYPES } from "../enums/file.enum.js";
import { mkdir, writeFile } from "node:fs/promises";

const dist = resolve("uploads");

const storage = multer.memoryStorage();

export const multerInstance = multer({ storage });

function getFilePath({ fieldname, userId, currCount, ext }) {
  const fileFullPath = normalize(
    `${dist}/${userId}/${fieldname}/${fieldname}-${currCount}.${ext}`,
  );

  const currDir = resolve();
  const filePath = relative(currDir, fileFullPath);

  return { filePath, fileFullPath };
}

async function processFiles({ files, allowedTypes, userId }) {
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
    const currCount = Array.isArray(fieldPaths) ? fieldPaths.length + 1 : 2;

    const { filePath, fileFullPath } = getFilePath({
      fieldname,
      userId,
      currCount,
      ext,
    });

    await mkdir(dirname(fileFullPath), { recursive: true });
    await writeFile(fileFullPath, buffer);

    const currPath = paths[fieldname];
    if (currPath) {
      if (!Array.isArray(currPath)) {
        paths[fieldname] = [currPath];
      }

      paths[fieldname].push(filePath);
    } else {
      paths[fieldname] = filePath;
    }
  }

  return paths;
}

export function upload(
  multerMiddleWare = multerInstance.array("attachment"),
  fileType = "",
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

      try {
        const paths = await processFiles({
          files,
          allowedTypes: FILE_MIME_TYPES[fileType] ?? [],
          userId: req.user.id,
        });

        req.paths = paths;

        return next();
      } catch (err) {
        return next(err);
      }
    });
  };
}
