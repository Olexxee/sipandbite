import logger from "../config/logger.js";
import prisma from "../config/db.js";
import cloudinary from "../config/cloudinary.js";
import toMenuResponse from "../utils/menuMapper.js";


// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const MENU_WITH_IMAGES = {
  images: {
    orderBy: {
      order: "asc",
    },
  },
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const logError = (message, error) => {
  logger.error({
    message,
    error: {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
      stack: error?.stack,
    },
  });
};

const deleteCloudinaryImages = async (images = []) => {
  for (const image of images) {
    if (!image?.publicId) {
      continue;
    }

    try {
      const result = await cloudinary.uploader.destroy(
        image.publicId,
      );

      logger.info({
        message: "Cloudinary image deleted",
        publicId: image.publicId,
        result,
      });
    } catch (error) {
      /*
       * Cloudinary cleanup is best-effort.
       * A failed Cloudinary deletion should not prevent
       * the database operation from completing.
       */
      logger.error({
        message: "Failed to delete Cloudinary image",
        publicId: image.publicId,
        error: {
          name: error?.name,
          message: error?.message,
          stack: error?.stack,
        },
      });
    }
  }
};

// ─────────────────────────────────────────────
// GET MENU
// ─────────────────────────────────────────────

export const getMenu = async (_req, res) => {
  try {
    const items = await prisma.menuItem.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: MENU_WITH_IMAGES,
    });

    const response = items.map(toMenuResponse);

    logger.info({
      message: "Menu fetched successfully",
      count: items.length,
    });

    return res.json(response);
  } catch (error) {
    logError("GET MENU ERROR", error);

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
    const { name, price, category } = req.body;
    const images = req.media ?? [];

    if (!name || price === undefined || !category) {
      return res.status(400).json({
        message: "Name, price and category are required",
      });
    }

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

      include: MENU_WITH_IMAGES,
    });

    logger.info({
      message: "Menu item created",
      id: item.id,
      name: item.name,
      category: item.category,
      imageCount: item.images.length,
    });

    return res.status(201).json(
      toMenuResponse(item),
    );
  } catch (error) {
    logError("CREATE MENU ITEM ERROR", error);

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
    const { id } = req.params;
    const { name, price, category } = req.body;
    const newImages = req.media ?? [];

    const existingItem =
      await prisma.menuItem.findUnique({
        where: {
          id,
        },
        include: MENU_WITH_IMAGES,
      });

    if (!existingItem) {
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

    /*
     * If new images were uploaded, replace the existing
     * image records.
     */
    if (newImages.length > 0) {
      data.images = {
        deleteMany: {},

        create: newImages.map((image, index) => ({
          url: image.url,
          publicId: image.publicId,
          order: index,
        })),
      };

      /*
       * Delete the old Cloudinary assets after preparing
       * the replacement data.
       */
      await deleteCloudinaryImages(
        existingItem.images,
      );
    }

    const updatedItem =
      await prisma.menuItem.update({
        where: {
          id,
        },

        data,

        include: MENU_WITH_IMAGES,
      });

    logger.info({
      message: "Menu item updated",
      id: updatedItem.id,
      name: updatedItem.name,
      category: updatedItem.category,
      imageCount: updatedItem.images.length,
    });

    return res.json(
      toMenuResponse(updatedItem),
    );
  } catch (error) {
    logError("UPDATE MENU ITEM ERROR", error);

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

    /*
     * Delete the database record first.
     *
     * The relation uses onDelete: Cascade, so all
     * MenuItemImage records are removed automatically.
     */
    await prisma.menuItem.delete({
      where: {
        id,
      },
    });

    /*
     * Cloudinary cleanup is best-effort and happens
     * after the database record has been removed.
     */
    await deleteCloudinaryImages(item.images);

    logger.info({
      message: "Menu item deleted",
      id: item.id,
      name: item.name,
      imageCount: item.images.length,
    });

    return res.json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    logError("DELETE MENU ITEM ERROR", error);

    return res.status(500).json({
      message: "Failed to delete menu item",
    });
  }
};

