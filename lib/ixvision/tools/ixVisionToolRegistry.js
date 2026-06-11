export const IX_VISION_TOOL_REGISTRY = {
  UPSCALE: {
    title: "Upscale",
    purpose: "Recover size and inspection usability from low-resolution web photos.",
    status: "planned",
    category: "resolution"
  },

  DEBLOCK: {
    title: "Deblock",
    purpose: "Reduce JPEG squares, web compression blocks, and hard pixel breakup.",
    status: "v1-next",
    category: "restoration"
  },

  DERING: {
    title: "Dering",
    purpose: "Reduce halos and ringing around machine edges, decals, booms, buckets, and sky lines.",
    status: "planned",
    category: "restoration"
  },

  DENOISE: {
    title: "Denoise",
    purpose: "Smooth sky, gravel, grass, shadows, and background noise without destroying machine detail.",
    status: "planned",
    category: "restoration"
  },

  CLARITY: {
    title: "Clarity",
    purpose: "Pull machine edges, tracks, tires, cylinders, cabs, and buckets forward.",
    status: "active",
    category: "detail"
  },

  REFINE: {
    title: "Refine",
    purpose: "Buff harsh pixels after clarity and reduce crunchy edge breakup.",
    status: "active",
    category: "finish"
  },

  COLOR_RECOVER: {
    title: "Color Recover",
    purpose: "Recover natural OEM paint color without repainting the machine.",
    status: "planned",
    category: "color"
  },

  EXPOSURE_RECOVER: {
    title: "Exposure Recover",
    purpose: "Recover shadows, brightness, and usable visibility from dark yard photos.",
    status: "planned",
    category: "light"
  },

  DEHAZE: {
    title: "Dehaze",
    purpose: "Cut haze, dust, flat light, and washed-out web-photo softness.",
    status: "planned",
    category: "light"
  },

  OEM_PROTECT: {
    title: "OEM Protect",
    purpose: "Protect CAT, Deere, Komatsu, Volvo, Case, and other paint families from fake color shifts.",
    status: "active",
    category: "truth"
  },

  INSPECTION_SAFE: {
    title: "Inspection Safe",
    purpose: "Preserve buyer-trust detail for Theater zoom instead of creating fake beauty.",
    status: "planned",
    category: "buyer"
  },

  JULIO: {
    title: "Julio",
    purpose: "Final dealer wax, paint depth, and presentation finish.",
    status: "active",
    category: "presentation"
  }
};
