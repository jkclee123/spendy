import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Get a temporary download URL for the iOS Shortcut file
 * This is a system-wide file that allows users to download the iOS shortcut
 * for creating transactions via the API
 */
export const getIosShortcutUrl = query({
  args: {},
  handler: async (ctx) => {
    // Get file ID from environment variable
    const fileId: string | undefined = process.env.IOS_API_SHORTCUT_FILE_ID;

    if (!fileId) {
      throw new Error("IOS_API_SHORTCUT_FILE_ID environment variable is not set");
    }

    // After validation, fileId is guaranteed to be a string

    try {
      // Generate a temporary URL for downloading the file
      // The URL expires after a short time (default Convex behavior)
      const url = await ctx.storage.getUrl(fileId as Id<"_storage">);

      if (!url) {
        throw new Error("iOS shortcut file not found");
      }

      return { url };
    } catch (error) {
      console.error("Failed to generate iOS shortcut download URL:", error);
      throw new Error("Failed to generate download URL for iOS shortcut");
    }
  },
});
