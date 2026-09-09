const toMenuResponse = (item) => {
  const images = (item.images || []).map((image) => ({
    id: image.id,
    url: image.url,
    publicId: image.publicId,
    order: image.order,
  }));

  return {
    id: item.id,
    name: item.name,
    price: Number(item.price),

    category: item.category.toLowerCase(),

    images,

    // Convenience field for existing frontend code.
    // This points to the first image.
    image: images[0] || {
      url: "",
      publicId: "",
    },

    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

export default toMenuResponse;
