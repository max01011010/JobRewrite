export async function extractResumeText(
  file: File,
  opts: { max_chars?: number; strip_urls?: boolean } = {}
) {
  const form = new FormData();
  form.append("file", file);
  if (opts && Object.keys(opts).length) {
    form.append("options", JSON.stringify(opts));
  }

  const res = await fetch("https://resume-extractor-izw9.onrender.com/extract", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Extractor error ${res.status}: ${msg}`);
  }

  return (await res.json()) as {
    text: string;
    meta: { filetype: string; chars: number; truncated: boolean; filename: string };
  };
}