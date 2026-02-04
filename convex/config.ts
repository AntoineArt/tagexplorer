import { query } from "./_generated/server";

export const checkApiKey = query({
  args: {},
  handler: async () => {
    return { configured: !!process.env.AI_GATEWAY_API_KEY };
  },
});
