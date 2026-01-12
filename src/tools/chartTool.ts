export const chartToolDefinition = {
  type: "function",
  function: {
    name: "generate_chart",
    description:
      "Generates a visual line chart when the user asks for data visualization.",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["line"],
          description: "The type of chart to generate. Always use 'line'.",
        },
        title: {
          type: "string",
          description: "The title of the chart.",
        },
        data: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: true,
          },
          description:
            "The data points for the chart. Example: [{'name': 'A', 'value': 10}, {'name': 'B', 'value': 20}]",
        },
        xKey: {
          type: "string",
          description:
            "The key in the data objects to use for the X-axis (e.g., 'name', 'month').",
        },
        yKey: {
          type: "string",
          description:
            "The key in the data objects to use for the Y-axis (e.g., 'value', 'sales').",
        },
      },
      required: ["type", "title", "data", "xKey", "yKey"],
    },
  },
};
