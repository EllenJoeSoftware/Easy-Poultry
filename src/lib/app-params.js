/**
 * App-level URL params. Kept thin since we no longer need Base44's appId/serverUrl/token.
 * Existing imports of `appParams` continue to work — the values are simply nullable.
 */
const isBrowser = typeof window !== 'undefined';

function getParam(name, { removeFromUrl = false } = {}) {
  if (!isBrowser) return null;
  const url = new URL(window.location.href);
  const value = url.searchParams.get(name);
  if (removeFromUrl && value) {
    url.searchParams.delete(name);
    window.history.replaceState({}, document.title, url.toString());
  }
  return value;
}

export const appParams = {
  appId: 'easy-poultry',
  serverUrl: null,
  token: getParam('access_token', { removeFromUrl: true }),
  fromUrl: isBrowser ? window.location.href : null,
  functionsVersion: null,
};
