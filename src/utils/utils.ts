/**
 * Prefix for assets referenced from `public/` via raw <img> / CSS url().
 *
 * Reads the same env var as `next.config.mjs` so the two can't disagree.
 * Previously this keyed off NODE_ENV and hardcoded "/Crypgo/", which meant a
 * `.env` containing NODE_ENV=production made every local asset 404 — that was
 * the cause of the broken logo in development.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const getImagePrefix = () => (basePath ? `${basePath}/` : "");

export { getImagePrefix };
