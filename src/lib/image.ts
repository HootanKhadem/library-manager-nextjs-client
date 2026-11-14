// shortcut: covers are stored inline as JPEG data URLs (no blob storage); move to object storage if the library grows large.
export function resizeImageToDataUrl(file: File, maxDim = 700, quality = 0.78): Promise<string> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
            const canvas = document.createElement("canvas");
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                URL.revokeObjectURL(url);
                reject(new Error("canvas unavailable"));
                return;
            }
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("invalid image"));
        };
        img.src = url;
    });
}
