export function getAccessToken(): ?string {
  return localStorage.getItem('jwt_access_token')
}

export function cleanUpOutdatedJWTs () {
  localStorage.removeItem('jwt_refresh_token')
  localStorage.removeItem('jwt_access_token')

}

export function setJwtAccess (newToken: string) {
  localStorage.setItem('jwt_access_token', newToken)
}

