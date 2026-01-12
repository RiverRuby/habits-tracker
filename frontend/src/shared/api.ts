const API_URL = process.env.REACT_APP_API_URL;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface APIError {
  status: number;
  message: string;
  details?: any;
}

class APIRequestError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = "APIRequestError";
    this.status = status;
    this.details = details;
  }
}

export class api {
  static async get(url: string): Promise<any> {
    const ID = localStorage.getItem("ID");
    if (!ID) return;

    try {
      const response = await fetch(API_URL + url, {
        headers: {
          Authorization: ID,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new APIRequestError(
          data.message || "API request failed",
          response.status,
          data,
        );
      }

      return data;
    } catch (error: APIError | any) {
      if (error instanceof APIRequestError) {
        throw error;
      }

      console.error(error);

      throw new APIRequestError("Failed to make API request", 500, {
        originalError: error.message,
      });
    }
  }

  static async post(url: string, body: object | FormData = {}): Promise<any> {
    const ID = localStorage.getItem("ID");
    if (!ID) return;

    const isForm = body instanceof FormData;
    let headers: HeadersInit = {
      Authorization: ID,
    };

    if (!isForm) {
      headers["Content-Type"] = "application/json";
    }

    try {
      const response = await fetch(API_URL + url, {
        method: "POST",
        headers,
        body: isForm ? body : JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new APIRequestError(
          data.message || "API request failed",
          response.status,
          data,
        );
      }

      return data;
    } catch (error: APIError | any) {
      if (error instanceof APIRequestError) {
        throw error;
      }

      throw new APIRequestError("Failed to make API request", 500, {
        originalError: error?.message,
      });
    }
  }
}
