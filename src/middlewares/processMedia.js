import logger from "../config/logger.js";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 4,
  },

  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG and WebP images are allowed"));
    }
  },
});

const processMedia = [
  upload.array("images", 4),

  async (req, res, next) => {
    try {
      logger.info("\n========== PROCESS MEDIA ==========");

      const files = req.files || [];

      logger.info("Files received:", {
        count: files.length,
        files: files.map((file) => ({
          name: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        })),
      });

      // Images are optional.
      if (files.length === 0) {
        req.media = [];

        logger.info("No images supplied.");
        logger.info("===================================\n");

        return next();
      }

      const uploadPromises = files.map(
        (file, index) =>
          new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              {
                folder: "sip-and-bite/menu",
                resource_type: "image",
              },

              (error, result) => {
                if (error) {
                  logger.error(
                    `Cloudinary error for image ${index + 1}:`,
                    error,
                  );

                  return reject(error);
                }

                if (!result) {
                  return reject(
                    new Error(
                      `Cloudinary returned no result for image ${index + 1}`,
                    ),
                  );
                }

                logger.info(
                  `Cloudinary upload successful: image ${index + 1}`,
                  {
                    secure_url: result.secure_url,
                    public_id: result.public_id,
                  },
                );

                resolve({
                  url: result.secure_url,
                  publicId: result.public_id,
                });
              },
            );

            stream.end(file.buffer);
          }),
      );

      const results = await Promise.all(uploadPromises);

      req.media = results;

      logger.info("Uploaded media:");
      console.dir(req.media, { depth: null });

      logger.info("===================================\n");

      return next();
    } catch (error) {
      logger.error("Cloudinary upload failed:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to upload images",
      });
    }
  },
];

export default processMedia;
