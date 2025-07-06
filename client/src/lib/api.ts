// Helper functions for API requests
import { getAuthToken } from "./cookie-utils";
import { buildAPIUrl } from "@/config/api";

/**
 * Makes an authenticated API request
 * @param url The URL to fetch from
 * @param options The fetch options
 * @returns The fetch response
 */
export async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get token from multiple sources
  const token = getAuthToken();
  
  // Create headers object
  const headers = new Headers(options.headers || {});
  
  // Set default headers
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  
  // Add authorization if token exists
  if (token) {
    const authHeader = `Bearer ${token}`;
    headers.set('Authorization', authHeader);
    
    // Store the auth header in localStorage for WebSocket use
    try {
      localStorage.setItem('authHeader', authHeader);
    } catch (err) {
      console.error('Failed to store auth header in localStorage:', err);
    }
  }
  
  // Create the request options with credentials included
  const requestOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Always include credentials for cookies
  };
  
  // Build the full URL for the request
  const fullUrl = buildAPIUrl(url);
  
  // Enhanced debugging for deployment troubleshooting
  console.log(`API Request Debug:`, {
    originalUrl: url,
    fullUrl: fullUrl,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown'
  });
  
  // Log the request for debugging
  if (token) {
    console.log(`Query: Adding Authorization header with token (first 10 chars): ${token.substring(0, 10)}...`);
  }
  
  // Make the request
  return fetch(fullUrl, requestOptions);
}

/**
 * Makes a GET request and parses the JSON response
 * @typeparam T The expected response type
 * @param url The URL to fetch from
 * @returns The parsed response data
 */
export async function get<T = any>(url: string): Promise<Response> {
  return await apiRequest(url);
}

/**
 * Makes a POST request with JSON body and parses the JSON response
 * @typeparam T The expected response type
 * @param url The URL to fetch from
 * @param data The data to send in the request body
 * @returns The parsed response data
 */
export async function post<T = any>(url: string, data: any, method: string = 'POST'): Promise<T> {
  const response = await apiRequest(url, {
    method: method,
    body: method !== 'DELETE' ? JSON.stringify(data) : undefined,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `${method} request failed with status ${response.status}`;
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  
  // If response is 204 No Content, return empty object
  if (response.status === 204) {
    return {} as T;
  }
  
  return await response.json() as T;
}

/**
 * Makes a PUT request with JSON body
 */
export function put(url: string, data: any): Promise<Response> {
  return apiRequest(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Makes a DELETE request
 */
export function del(url: string): Promise<Response> {
  return apiRequest(url, {
    method: 'DELETE',
  });
}

/**
 * Helper function to handle common admin API response patterns
 * Returns the data or throws an error with the error message
 */
export async function adminApiCall<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  data?: any
): Promise<T> {
  // Use the same apiRequest function that works for other authenticated requests
  const options: RequestInit = {
    method,
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  const response = await apiRequest(endpoint, options);
  
  if (!response.ok) {
    // Handle common error cases
    if (response.status === 401) {
      throw new Error('Authentication required. Please log in again.');
    } else if (response.status === 403) {
      throw new Error('You do not have permission to perform this action.');
    }
    
    // Try to get error message from response
    let errorText;
    try {
      const errorData = await response.json();
      errorText = errorData.message || `Request failed with status ${response.status}`;
    } catch {
      errorText = await response.text() || `Request failed with status ${response.status}`;
    }
    throw new Error(errorText);
  }
  
  // If response is 204 No Content, return empty object
  if (response.status === 204) {
    return {} as T;
  }
  
  // Otherwise parse JSON
  return await response.json();
}