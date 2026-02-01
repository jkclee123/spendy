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

      // Check if user already exists
      const existingUser = await ctx.runQuery(api.users.getByEmail, { email });

      if (existingUser) {
        return new Response(
          JSON.stringify({ success: true, userId: existingUser._id }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Create new user
      const userId = await ctx.runMutation(api.users.create, {
        name,
        email,
        image,
      });

      // Create default categories for new user
      await ctx.runMutation(api.userCategories.create, {
        userId,
        emoji: "🍗",
        name: "Restaurant",
        currentLang: "en",
      });

      await ctx.runMutation(api.userCategories.create, {
        userId,
        emoji: "🚃",
        name: "Transport",
        currentLang: "en",
      });

      // Update default categories with Chinese names
      const categories = await ctx.runQuery(api.userCategories.listByUser, {
        userId,
      });

      for (const category of categories) {
        if (category.emoji === "🍗") {
          await ctx.runMutation(api.userCategories.update, {
            categoryId: category._id,
            name: "食飯",
            currentLang: "zh-HK",
          });
        } else if (category.emoji === "🚃") {
          await ctx.runMutation(api.userCategories.update, {
            categoryId: category._id,
            name: "搭車",
            currentLang: "zh-HK",
          });
        }
      }

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
