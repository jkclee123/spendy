import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  // Detect locale from browser or use default
  const locale = "en"; // Will be overridden by client-side detection

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
