// Helper functions for the application

/**
 * Get the base URL for API requests and file downloads
 * @returns {string} The base URL without trailing slash
 */
export const getApiBaseUrl = () => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
  return baseUrl.replace(/\/$/, '') // Remove trailing slash if present
}

/**
 * Construct a full URL for file downloads
 * @param {string} filePath - The file path from the server
 * @returns {string} The full URL to download the file
 */
export const getFileDownloadUrl = (filePath) => {
  if (!filePath) return null
  const base = getApiBaseUrl().replace(/\/api$/, '') // Remove /api suffix for file URLs
  return `${base}/${filePath.replace(/^\//, '')}`
}