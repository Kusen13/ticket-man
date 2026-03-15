import imageCompression from 'browser-image-compression';

export const compressImage = async (file: File): Promise<File> => {
  if (!file.type.startsWith('image/')) return file;
  
  const options = {
    maxSizeMB: 0.05, // 50KB
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.8
  };
  
  try {
    const compressedBlob = await imageCompression(file, options);
    // Convert blob to file so it maintains a filename
    const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, ".webp"), {
      type: "image/webp",
      lastModified: Date.now()
    });
    return compressedFile;
  } catch (error) {
    console.error('Compression error:', error);
    return file; // return original if it fails
  }
};
