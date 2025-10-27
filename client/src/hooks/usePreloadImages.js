import { useEffect, useState } from "react";

export default function usePreloadImages(imageUrls = []) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let loadedCount = 0;
    const total = imageUrls.length;
    const imageCache = [];

    imageUrls.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loadedCount++;
        imageCache.push(img);
        if (loadedCount === total) setLoaded(true);
      };
      img.onerror = () => {
        loadedCount++;
        if (loadedCount === total) setLoaded(true);
      };
    });

    // Prevent reloading on every render
    return () => imageCache.length = 0;
  }, [imageUrls]);

  return loaded;
}
