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
    });

    items.forEach((item) => {
      logger.info({
        id: item.id,
        name: item.name,
        price: item.price,
        category: item.category,
        imageUrl: item.imageUrl,
        publicId: item.publicId,
      });
    });

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
    logger.info("Request body:", req.body);
    logger.info("Uploaded media:", req.media);

    const { name, price, category } = req.body;

    logger.info("Parsed values:", {
      name,
      price,
      category,
      priceType: typeof price,
      categoryType: typeof category,
    });

    if (!name || price === undefined || !category) {
      logger.info("Validation failed: missing required fields");

      return res.status(400).json({
        message: "Name, price and category are required",
      });
    }

    const validCategories = ["FOOD", "DRINK", "ROOM"];

    if (!validCategories.includes(category)) {
      logger.info("Invalid category:", category);

      return res.status(400).json({
        message: "Invalid menu category",
      });
    }

    const item = await prisma.menuItem.create({
      data: {
        name: name.trim(),
        price: Number(price),
        category,

        imageUrl: req.media?.url || null,
        publicId: req.media?.publicId || null,
      },
    });

    logger.info("Created database item:");
    console.dir(item, { depth: null });

    const response = toMenuResponse(item);

    logger.info("Response being sent:");
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
  logger.info("\n========== UPDATE MENU ITEM ==========");

  try {
    const { id } = req.params;

    logger.info("Item ID:", id);
    logger.info("Request body:", req.body);
    logger.info("Uploaded media:", req.media);

    const { name, price, category } = req.body;

    const item = await prisma.menuItem.findUnique({
      where: {
        id,
      },
    });

    logger.info("Existing database item:");
    console.dir(item, { depth: null });

    if (!item) {
      logger.info("Menu item not found");

      return res.status(404).json({
        message: "Menu item not found",
      });
    }

    if (category !== undefined) {
      const validCategories = ["FOOD", "DRINK", "ROOM"];

      if (!validCategories.includes(category)) {
        logger.info("Invalid category:", category);

        return res.status(400).json({
          message: "Invalid menu category",
        });
      }
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
    // NEW IMAGE
    // ─────────────────────────────────────────

    if (req.media) {
      logger.info("New image uploaded:", req.media);

      if (item.publicId) {
        logger.info("Deleting old Cloudinary image:", item.publicId);

        try {
          const cloudinaryResult =
            await cloudinary.uploader.destroy(item.publicId);

          logger.info(
            "Old Cloudinary image deletion result:",
            cloudinaryResult,
          );
        } catch (error) {
          logger.error(
            "Failed to delete old Cloudinary image:",
            error,
          );
        }
      }

      data.imageUrl = req.media.url;
      data.publicId = req.media.publicId;
    }

    logger.info("Prisma update data:");
    console.dir(data, { depth: null });

    const updatedItem = await prisma.menuItem.update({
      where: {
        id,
      },
      data,
    });

    logger.info("Updated database item:");
    console.dir(updatedItem, { depth: null });

    const response = toMenuResponse(updatedItem);

    logger.info("Response being sent:");
    console.dir(response, { depth: null });

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
  logger.info("\n========== DELETE MENU ITEM ==========");

  try {
    const { id } = req.params;

    logger.info("Item ID:", id);

    const item = await prisma.menuItem.findUnique({
      where: {
        id,
      },
    });

    logger.info("Database item:");
    console.dir(item, { depth: null });

    if (!item) {
      logger.info("Menu item not found");

      return res.status(404).json({
        message: "Menu item not found",
      });
    }

    // ─────────────────────────────────────────
    // DELETE CLOUDINARY IMAGE
    // ─────────────────────────────────────────

    if (item.publicId) {
      logger.info(
        "Deleting Cloudinary image:",
        item.publicId,
      );

      try {
        const cloudinaryResult =
          await cloudinary.uploader.destroy(item.publicId);

        logger.info(
          "Cloudinary deletion result:",
          cloudinaryResult,
        );
      } catch (error) {
        logger.error(
          "Failed to delete Cloudinary image:",
          error,
        );
      }
    } else {
      logger.info("No Cloudinary publicId found");
    }

    // ─────────────────────────────────────────
    // DELETE DATABASE RECORD
    // ─────────────────────────────────────────

    await prisma.menuItem.delete({
      where: {
        id,
      },
    });

    logger.info("Database item deleted successfully");
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

