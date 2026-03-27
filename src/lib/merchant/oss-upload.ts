type UploadResponse = {
  url: string;
};

export async function uploadToOss(scene: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append("scene", scene);
  formData.append("file", file);

  const uploadResponse = await fetch("/api/merchant/uploads/oss", {
    method: "POST",
    body: formData
  });
  if (!uploadResponse.ok) {
    throw new Error("OSS upload failed");
  }

  const result = (await uploadResponse.json()) as {
    message?: string;
    data?: UploadResponse;
  };
  if (!result.data?.url) {
    throw new Error(result.message || "OSS upload failed");
  }

  return result.data.url;
}
