const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_TEXT_LENGTH = 50_000;
const MIN_TEXT_LENGTH = 100;

// PDF magic bytes: %PDF (0x25 0x50 0x44 0x46)
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46];

export async function extractText(request: Request): Promise<string> {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    return extractFromFile(request);
  }

  if (contentType.includes('application/json')) {
    return extractFromJson(request);
  }

  throw new Error('Unsupported content type. Send multipart/form-data (PDF) or application/json (text).');
}

async function extractFromFile(request: Request): Promise<string> {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) throw new Error('No file provided');
  if (file.size > MAX_FILE_SIZE) throw new Error('File too large (max 5MB)');
  if (file.size === 0) throw new Error('File is empty');

  const buffer = await file.arrayBuffer();
  const header = new Uint8Array(buffer.slice(0, 4));

  const isPDF = PDF_MAGIC.every((byte, i) => header[i] === byte);
  if (!isPDF) throw new Error('Only PDF files are accepted');

  const { extractText: extractPdfText } = await import('unpdf');
  const { text: pages } = await extractPdfText(new Uint8Array(buffer), { mergePages: true });
  const text = pages as string;

  const sanitised = sanitise(text);
  if (sanitised.length < MIN_TEXT_LENGTH) {
    throw new Error('Could not extract enough text from the PDF. Try pasting the text instead.');
  }

  // Truncate to same limit used for text input to prevent API cost blowout
  return sanitised.length > MAX_TEXT_LENGTH ? sanitised.slice(0, MAX_TEXT_LENGTH) : sanitised;
}

async function extractFromJson(request: Request): Promise<string> {
  const body = (await request.json()) as { text?: string };

  if (!body.text || typeof body.text !== 'string') {
    throw new Error('No text provided');
  }

  const sanitised = sanitise(body.text.slice(0, MAX_TEXT_LENGTH));
  if (sanitised.length < MIN_TEXT_LENGTH) {
    throw new Error('Text is too short to analyse (minimum 100 characters)');
  }

  return sanitised;
}

function sanitise(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // strip control chars (keep \t \n \r)
    .trim();
}
