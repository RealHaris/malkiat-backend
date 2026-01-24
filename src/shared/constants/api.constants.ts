export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
} as const;

export const MESSAGES = {
  SUCCESS: {
    CREATED: (entity: string) => `${entity} created successfully`,
    UPDATED: (entity: string) => `${entity} updated successfully`,
    DELETED: (entity: string) => `${entity} deleted successfully`,
    RETRIEVED: (entity: string) => `${entity} retrieved successfully`,
  },
  ERROR: {
    NOT_FOUND: (entity: string) => `${entity} not found`,
    UNAUTHORIZED: (roles: string) => `Unauthorized - requires ${roles} role`,
    VALIDATION_ERROR: "Bad request - validation error",
  },
  DESCRIPTION: {
    SESSION_TOKEN: "Session token",
  },
} as const;

export const API_OPERATIONS = {
  CREATE_LISTING: { summary: "Create a new listing" },
  UPDATE_LISTING: { summary: "Update an existing listing" },
  DELETE_LISTING: { summary: "Delete a listing" },
  DISCOVER_LISTINGS: { summary: "Discover listings" },
  SEARCH_LISTINGS: { summary: "Search listings" },
  GET_CURRENT_USER: { summary: "Get current user" },
  PUBLIC_ROUTE: { summary: "Public route" },
  OPTIONAL_AUTH_ROUTE: { summary: "Optional auth route" },
} as const;

export const API_RESPONSES = {
  CREATED: (entity: string) => ({
    status: HTTP_STATUS.CREATED,
    description: MESSAGES.SUCCESS.CREATED(entity),
  }),
  UPDATED: (entity: string) => ({
    status: HTTP_STATUS.OK,
    description: MESSAGES.SUCCESS.UPDATED(entity),
  }),
  DELETED: (entity: string) => ({
    status: HTTP_STATUS.OK,
    description: MESSAGES.SUCCESS.DELETED(entity),
  }),
  RETRIEVED: (entity: string) => ({
    status: HTTP_STATUS.OK,
    description: MESSAGES.SUCCESS.RETRIEVED(entity),
  }),
  NOT_FOUND: (entity: string) => ({
    status: HTTP_STATUS.NOT_FOUND,
    description: MESSAGES.ERROR.NOT_FOUND(entity),
  }),
  UNAUTHORIZED: (roles: string) => ({
    status: HTTP_STATUS.UNAUTHORIZED,
    description: MESSAGES.ERROR.UNAUTHORIZED(roles),
  }),
  VALIDATION_ERROR: {
    status: HTTP_STATUS.BAD_REQUEST,
    description: MESSAGES.ERROR.VALIDATION_ERROR,
  },
  GET_CURRENT_USER: {
    status: HTTP_STATUS.OK,
    description: "Returns the currently authenticated user",
  },
  PUBLIC_ROUTE: {
    status: HTTP_STATUS.OK,
    description: "Public endpoint, no authentication required",
  },
  OPTIONAL_AUTH_ROUTE: {
    status: HTTP_STATUS.OK,
    description: "Returns authentication status",
  },
} as const;

export const API_HEADERS = {
  AUTHORIZATION: {
    name: "Authorization",
    description: MESSAGES.DESCRIPTION.SESSION_TOKEN,
    required: true,
  },
} as const;

export const LISTING_STATUS = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export const SORT_OPTIONS = ["newest", "price_asc", "price_desc", "relevance"] as const;
export const DISCOVERY_SORT_OPTIONS = ["newest", "price_asc", "price_desc"] as const;
export const SEARCH_SORT_OPTIONS = ["relevance", "newest", "price_asc", "price_desc"] as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PER_PAGE: 20,
} as const;

export const CURRENCY_CODES = ["USD", "EUR", "GBP", "AED"];
export const PROPERTY_TYPES = ["apartment", "house", "villa", "condo"];

export const VALIDATION_MESSAGES = {
  REQUIRED: (field: string) => `${field} is required`,
  INVALID_UUID: (field: string) => `${field} must be a valid UUID`,
  INVALID_EMAIL: "Email must be valid",
  MIN_LENGTH: (field: string, min: number) => `${field} must be at least ${min} characters`,
  MAX_LENGTH: (field: string, max: number) => `${field} must not exceed ${max} characters`,
  MIN_VALUE: (field: string, min: number) => `${field} must be at least ${min}`,
  MAX_VALUE: (field: string, max: number) => `${field} must not exceed ${max}`,
  INVALID_ENUM: (field: string, values: string[]) =>
    `${field} must be one of: ${values.join(", ")}`,
  POSITIVE_NUMBER: (field: string) => `${field} must be a positive number`,
} as const;
