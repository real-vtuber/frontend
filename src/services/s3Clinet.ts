export async function uploadFileToS3(uploadUrl: string, file: File) {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });
  
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
  
    return true;
  }
  