export function classify(file: File) {
  const m = file.type,
    n = file.name;
  if (m.startsWith("image/")) return "Image";
  if (m.startsWith("video/")) return "Video";
  if (m.startsWith("audio/")) return "Audio";
  if (m === "application/pdf" || /\.pdf$/i.test(n)) return "PDF";
  if (
    m.startsWith("text/") ||
    /\.(txt|md|csv|json|xml|html|css|js|yaml|yml|log)$/i.test(n)
  )
    return "Text";
  return "File";
}
export function thumbnail(file: File): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    if (!file.type.startsWith("image/")) return resolve(null);
    const url = URL.createObjectURL(file),
      image = new Image();
    let settled = false;
    const done = (value: string | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      resolve(value);
    };
    const timer = setTimeout(() => done(null), 8000);
    image.onload = () => {
      try {
        const scale = Math.min(1, 600 / image.width, 600 / image.height),
          canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas previews unavailable");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        done(canvas.toDataURL("image/webp", 0.8));
      } catch {
        done(null);
      }
    };
    image.onerror = () => done(null);
    image.src = url;
  });
}
