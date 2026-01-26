import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

/**
 * HTTP endpoint to sync a user from NextAuth to Convex
 * Called when a user signs in via OAuth
 */
http.route({
  path: "/auth/sync-user",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    // Verify the request has the correct secret
    const authHeader = request.headers.get("Authorization");
    const expectedSecret = process.env.CONVEX_AUTH_SECRET;

    if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const body = await request.json();
      const { name, email, image } = body;

      if (!email || !name) {
        return new Response(
          JSON.stringify({ error: "Missing required fields" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Create or get existing user
      const userId = await ctx.runMutation(api.users.create, {
        name,
        email,
        image,
      });

      return new Response(JSON.stringify({ success: true, userId }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error syncing user:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;
