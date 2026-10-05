// Простая авторизация по одному паролю (ADMIN_PASSWORD).
// Cookie содержит HMAC-подпись, поэтому подделать сессию без SESSION_SECRET нельзя.
export const SESSION_COOKIE = "session";
const MAX_AGE_SEC = 60 * 60 * 24 * 7;

async function hmac(payload: string): Promise<string> {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) throw new Error("SESSION_SECRET должен быть не короче 16 символов");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Buffer.from(sig).toString("base64url");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createSession(): Promise<{ value: string; maxAge: number }> {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  return { value: `${exp}.${await hmac(String(exp))}`, maxAge: MAX_AGE_SEC };
}

export async function verifySession(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  const [exp, sig] = value.split(".");
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  return safeEqual(sig, await hmac(exp));
}

export async function checkPassword(input: string): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  // Сравниваем хэши, чтобы длина пароля не влияла на время ответа.
  const h = async (s: string) =>
    Buffer.from(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))).toString("hex");
  return safeEqual(await h(input), await h(expected));
}
