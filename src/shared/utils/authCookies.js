const secureCookie = window.location.protocol === 'https:' ? '; Secure' : ''
const defaultCookieOptions = `Path=/; SameSite=Strict${secureCookie}`

export function getCookie(name) {
  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))

  return cookie ? decodeURIComponent(cookie.split('=').slice(1).join('=')) : ''
}

export function setCookie(name, value, maxAgeSeconds) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; ${defaultCookieOptions}`
}

export function deleteCookie(name) {
  document.cookie = `${name}=; Max-Age=0; ${defaultCookieOptions}`
}

export function setAuthCookies(tokens) {
  setCookie('accessToken', tokens.accessToken, tokens.accessTokenExpiresIn)
  setCookie('refreshToken', tokens.refreshToken, tokens.refreshTokenExpiresIn)
}

export function clearAuthCookies() {
  deleteCookie('accessToken')
  deleteCookie('refreshToken')
}

export function hasAccessToken() {
  return Boolean(getCookie('accessToken'))
}
