import { saveAssetMetadata, uploadSignature } from "../../api/assets";

export async function uploadChatAttachment(uri: string, fileName: string, mimeType = "application/octet-stream") {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = await uploadSignature({
    timestamp,
    folder: "sabahub/chat",
  });

  const formData = new FormData();
  formData.append("file", {
    uri,
    name: fileName,
    type: mimeType,
  } as unknown as Blob);
  formData.append("api_key", signature.apiKey);
  formData.append("timestamp", String(timestamp));
  formData.append("signature", signature.signature);
  if (signature.params?.folder) {
    formData.append("folder", signature.params.folder);
  }

  const cloudinaryEndpoint = `https://api.cloudinary.com/v1_1/${signature.cloudName}/auto/upload`;
  const uploadResponse = await fetch(cloudinaryEndpoint, {
    method: "POST",
    body: formData,
  });

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload attachment");
  }

  const result = (await uploadResponse.json()) as {
    secure_url: string;
    public_id: string;
    resource_type?: string;
    bytes?: number;
  };

  return saveAssetMetadata({
    scope: "CHAT",
    title: fileName,
    secureUrl: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
    mimeType,
    size: result.bytes,
  });
}
