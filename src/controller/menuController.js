import logger from "../config/logger.js";
import prisma from "../config/db.js";
import cloudinary from "../config/cloudinary.js";
import toMenuResponse from "../utils/menuMapper.js";

// ─────────────────────────────────────────────
// GET MENU
// ─────────────────────────────────────────────

export const getMenu = async (req, res) => {
  try {
    const items = await prisma.menuItem.findMany({
      orderBy: {
        createdAt: "desc",
      },

      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    logger.info(`Fetched ${items.length} menu items.`);

    const response = items.map(toMenuResponse);

    return res.json(response);
  } catch (error) {
    logger.error("GET MENU ERROR:", error);

    return res.status(500).json({
      message: "Failed to fetch menu",
    });
  }
};

// ─────────────────────────────────────────────
// CREATE MENU ITEM
// ─────────────────────────────────────────────

export const createMenuItem = async (req, res) => {
  try {
    logger.info("\n========== CREATE MENU ITEM ==========");

    logger.info("Request body:", req.body);
    logger.info("Uploaded media:", req.media);

    const { name, price, category } = req.body;

    if (!name || price === undefined || !category) {
      return res.status(400).json({
        message: "Name, price and category are required",
      });
    }

    const images = req.media || [];

    logger.info("Creating menu item:", {
      name,
      price,
      category,
      imageCount: images.length,
    });

    const item = await prisma.menuItem.create({
      data: {
        name: name.trim(),
        price: Number(price),
        category,

        images: {
          create: images.map((image, index) => ({
            url: image.url,
            publicId: image.publicId,
            order: index,
          })),
        },
      },

      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    logger.info("Created menu item:");
    console.dir(item, { depth: null });

    const response = toMenuResponse(item);

    logger.info("Response:");
    console.dir(response, { depth: null });

    logger.info("======================================\n");

    return res.status(201).json(response);
  } catch (error) {
    logger.error("CREATE MENU ITEM ERROR:", error);

    return res.status(500).json({
      message: "Failed to create menu item",
    });
  }
};

// ─────────────────────────────────────────────
// UPDATE MENU ITEM
// ─────────────────────────────────────────────

export const updateMenuItem = async (req, res) => {
  try {
    logger.info("\n========== UPDATE MENU ITEM ==========");

    const { id } = req.params;
    const { name, price, category } = req.body;

    const newImages = req.media || [];

    logger.info("Item ID:", id);
    logger.info("Request body:", req.body);
    logger.info("New images:", newImages);

    const item = await prisma.menuItem.findUnique({
      where: {
        id,
      },

      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!item) {
      return res.status(404).json({
        message: "Menu item not found",
      });
    }

    const data = {};

    if (name !== undefined) {
      data.name = name.trim();
    }

    if (price !== undefined) {
      data.price = Number(price);
    }

    if (category !== undefined) {
      data.category = category;
    }

    // ─────────────────────────────────────────
    // REPLACE IMAGES
    // ─────────────────────────────────────────

    if (newImages.length > 0) {
      logger.info(
        `Replacing ${item.images.length} old image(s) with ${newImages.length} new image(s).`,
      );

      /*
       * Delete old Cloudinary assets.
       *
       * We keep this operation best-effort so a failed
       * Cloudinary deletion does not prevent the database
       * update.
       */
      for (const image of item.images) {
        if (!image.publicId) {
          continue;
        }

        try {
          const result = await cloudinary.uploader.destroy(image.publicId);

          logger.info("Deleted old Cloudinary image:", {
            publicId: image.publicId,
            result,
          });
        } catch (error) {
          logger.error(
            `Failed to delete Cloudinary image ${image.publicId}:`,
            error,
          );
        }
      }

      /*
       * Replace the database image records.
       */
      data.images = {
        deleteMany: {},

        create: newImages.map((image, index) => ({
          url: image.url,
          publicId: image.publicId,
          order: index,
        })),
      };
    }

    const updatedItem = await prisma.menuItem.update({
      where: {
        id,
      },

      data,

      include: {
        images: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    logger.info("Updated menu item:");
    console.dir(updatedItem, { depth: null });

    const response = toMenuResponse(updatedItem);

    logger.info("======================================\n");

    return res.json(response);
  } catch (error) {
    logger.error("UPDATE MENU ITEM ERROR:", error);

    return res.status(500).json({
      message: "Failed to update menu item",
    });
  }
};

// ─────────────────────────────────────────────
// DELETE MENU ITEM
// ─────────────────────────────────────────────

export const deleteMenuItem = async (req, res) => {
  try {
    logger.info("\n========== DELETE MENU ITEM ==========");

    const { id } = req.params;

    const item = await prisma.menuItem.findUnique({
      where: {
        id,
      },

      include: {
        images: true,
      },
    });

    if (!item) {
      return res.status(404).json({
        message: "Menu item not found",
      });
    }

    logger.info("Deleting menu item:", {
      id: item.id,
      name: item.name,
      imageCount: item.images.length,
    });

    // ─────────────────────────────────────────
    // DELETE CLOUDINARY IMAGES
    // ─────────────────────────────────────────

    for (const image of item.images) {
      if (!image.publicId) {
        continue;
      }

      try {
        const result = await cloudinary.uploader.destroy(image.publicId);

        logger.info("Deleted Cloudinary image:", {
          publicId: image.publicId,
          result,
        });
      } catch (error) {
        logger.error(
          `Failed to delete Cloudinary image ${image.publicId}:`,
          error,
        );
      }
    }

    // ─────────────────────────────────────────
    // DELETE DATABASE RECORD
    // ─────────────────────────────────────────

    await prisma.menuItem.delete({
      where: {
        id,
      },
    });

    logger.info("Database item deleted successfully.");
    logger.info("======================================\n");

    return res.json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    logger.error("DELETE MENU ITEM ERROR:", error);

    return res.status(500).json({
      message: "Failed to delete menu item",
    });
  }
};
