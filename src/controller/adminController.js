import logger from "../config/logger.js";
import prisma from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cloudinary from "../config/cloudinary.js";
import toMenuResponse  from "../utils/menuMapper.js";

// ─────────────────────────────────────────────
// ADMIN LOGIN
// ─────────────────────────────────────────────

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await prisma.admin.findUnique({
      where: {
        email: email.toLowerCase().trim(),
      },
    });

    if (!admin) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const valid = await bcrypt.compare(password, admin.password);

    if (!valid) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const token = jwt.sign(
      {
        adminId: admin.id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    return res.json({
      token,
    });
  } catch (error) {
    logger.error("Admin login error:", error);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

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

    return res.json(items.map(toMenuResponse));
  } catch (error) {
    logger.error("Get menu error:", error);

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

    const item = await prisma.menuItem.create({
      data: {
        name,
        price,
        category,

        imageUrl: req.media?.url || null,
        publicId: req.media?.publicId || null,
      },
    });

    return res.status(201).json(toMenuResponse(item));
  } catch (error) {
    logger.error("Create menu item error:", error);

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

    const item = await prisma.menuItem.findUnique({
      where: {
        id,
      },
    });

    if (!item) {
      return res.status(404).json({
        message: "Menu item not found",
      });
    }

    const data = {};

    if (name !== undefined) {
      data.name = name;
    }

    if (price !== undefined) {
      data.price = price;
    }

    if (category !== undefined) {
      data.category = category;
    }

    // ─────────────────────────────────────────
    // NEW IMAGE
    // ─────────────────────────────────────────

    if (req.media) {
      if (item.publicId) {
        try {
          await cloudinary.uploader.destroy(item.publicId);
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

    const updatedItem = await prisma.menuItem.update({
      where: {
        id,
      },
      data,
    });

    return res.json(toMenuResponse(updatedItem));
  } catch (error) {
    logger.error("Update menu item error:", error);

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
    });

    if (!item) {
      return res.status(404).json({
        message: "Menu item not found",
      });
    }

    if (item.publicId) {
      try {
        await cloudinary.uploader.destroy(item.publicId);
      } catch (error) {
        logger.error(
          "Failed to delete Cloudinary image:",
          error,
        );
      }
    }

    await prisma.menuItem.delete({
      where: {
        id,
      },
    });

    return res.json({
      success: true,
    });
  } catch (error) {
    logger.error("Delete menu item error:", error);

    return res.status(500).json({
      message: "Failed to delete menu item",
    });
  }
};
