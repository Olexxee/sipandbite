const toMenuResponse = (item) => {
  return {
    id: item.id,
    name: item.name,
    price: Number(item.price),

    // Frontend uses lowercase categories
    category: item.category.toLowerCase(),

    image: {
      url: item.imageUrl || "",
      publicId: item.publicId || "",
    },

    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

export default toMenuResponse;

