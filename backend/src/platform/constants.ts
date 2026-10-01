// Request ID Middleware
export const REQUEST_ID_HEADER = "X-Request-ID";
export const VALID_REQUEST_ID = /^[\w-]{1,128}$/;

// Logging Middleware
export const LOG_FORMAT =
  ':date[iso] :id :remote-addr ":method :url HTTP/:http-version" :status :res[content-length] - :response-time ms';

// Auth
export const AUTH_COOKIE_NAME = "access_token";
export const JWT_ALGORITHM = "HS256";
