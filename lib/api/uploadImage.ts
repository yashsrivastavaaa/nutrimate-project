const CLOUDINARY_UPLOAD_PRESET = "nutrimate";

function getMimeType(uri: string) {
  const match = uri.toLowerCase().match(/\.(jpg|jpeg|png|heic|heif|webp)$/);
  switch (match?.[1]) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "heic":
    case "heif":
      return "image/heic";
    case "webp":
      return "image/webp";
    default:
      return "image/jpeg";
  }
}

export async function uploadImage(imageUri: string) {
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? process.env.CLOUDINARY_CLOUD_NAME;

  if (!cloudName) {
    throw new Error("Cloudinary cloud name is missing. Set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME.");
  }

  const formData = new FormData();
  const fileName = imageUri.split("/").pop() ?? `donation-${Date.now()}.jpg`;

  formData.append("file", {
    uri: imageUri,
    name: fileName,
    type: getMimeType(fileName),
  } as any);

  // Use upload preset if available, otherwise use timestamp + public_id approach
  const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? CLOUDINARY_UPLOAD_PRESET;
  if (uploadPreset) {
    formData.append("upload_preset", uploadPreset);
  }

  // Add folder organization
  formData.append("folder", "nutrimate/donations");

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "Unable to upload image.");
  }

  if (!payload?.secure_url) {
    throw new Error("Cloudinary did not return an image URL.");
  }

  return payload.secure_url as string;
}
