import axios from "axios";
import swagger from "../swagger.json";

export const petStoreToolDefinition = {
  type: "function",
  function: {
    name: "petstore_request",
    description: `Execute a request to the Petstore API. 
Base URL: https://petstore.swagger.io/v2
Available Endpoints (Summary):
${Object.keys(swagger.paths)
  .map((path) => `- ${path}`)
  .join("\n")}
`,
    parameters: {
      type: "object",
      properties: {
        method: {
          type: "string",
          enum: ["GET", "POST", "PUT", "DELETE"],
          description: "HTTP method",
        },
        path: {
          type: "string",
          description: "API path (e.g., '/pet/1', '/store/inventory')",
        },
        data: {
          type: "object",
          description: "JSON body for POST/PUT requests",
          additionalProperties: true,
        },
        params: {
          type: "object",
          description: "Query parameters",
          additionalProperties: true,
        },
      },
      required: ["method", "path"],
    },
  },
};

export const executePetStoreRequest = async (args: {
  method: string;
  path: string;
  data?: any;
  params?: any;
}) => {
  const baseUrl = "https://petstore.swagger.io/v2";

  try {
    const response = await axios({
      method: args.method,
      url: baseUrl + args.path,
      params: args.params,
      data: args.data,
      headers: {
        "Content-Type": "application/json",
        api_key: "special-key",
      },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(`Petstore API Error: ${error.message}`);
  }
};
