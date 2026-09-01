import logger from "../config/logger.js";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG and WebP images are allowed"));
    }
  },
});

const processMedia = [
  upload.single("image"),

  async (req, res, next) => {
    try {
      logger.info("\n========== PROCESS MEDIA ==========");

      logger.info("File received:", {
        exists: !!req.file,
        name: req.file?.originalname,
        mimetype: req.file?.mimetype,
        size: req.file?.size,
      });

      // Image is optional.
      if (!req.file) {
        logger.info("No image supplied.");
        logger.info("===================================\n");

        return next();
      }

      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "sip-and-bite/menu",
            resource_type: "image",
          },

          (error, result) => {
            if (error) {
              logger.error("Cloudinary error:", error);
              return reject(error);
            }

            if (!result) {
              return reject(
                new Error("Cloudinary returned no result"),
              );
            }

            logger.info("Cloudinary response:", {
              secure_url: result.secure_url,
              public_id: result.public_id,
            });

            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
            });
          },
        );

        stream.end(req.file.buffer);
      });

      logger.info("Raw Cloudinary URL:");
      logger.info(result.secure_url);

      logger.info("Raw Cloudinary public ID:");
      logger.info(result.public_id);

      req.media = {
        url: result.secure_url,
        publicId: result.public_id,
      };

      logger.info("req.media:");
      console.dir(req.media, { depth: null });

      logger.info("===================================\n");

      next();
    } catch (error) {
      logger.error("Cloudinary upload failed:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to upload image",
      });
    }
  },
];

export default processMedia;

