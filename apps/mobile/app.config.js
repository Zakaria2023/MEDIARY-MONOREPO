const fs = require("fs");
const path = require("path");

// THE ONE .env.local AT THE MONOREPO ROOT, as every other app reads it. Expo
// only loads .env files from the app's own folder, so the values the app
// needs are read here and handed to it through `extra`; a variable already
// set in the shell (or on the build service) wins over the file.
const parseEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const values = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }
    values[trimmed.slice(0, eq).trim()] = trimmed
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
  return values;
};

const rootEnv = parseEnvFile(path.resolve(__dirname, "../../.env.local"));

const read = (...names) => {
  for (const name of names) {
    const value = process.env[name] || rootEnv[name];
    if (value) {
      return value;
    }
  }
  return undefined;
};

module.exports = {
  expo: {
    name: "Mediary",
    slug: "mediary",
    scheme: "mediary",
    version: "0.1.0",
    orientation: "portrait",
    // Dark first, as the site is: the palette in src/lib/theme.ts is the
    // site's dark tokens.
    userInterfaceStyle: "dark",
    backgroundColor: "#090a10",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.mediary.app",
    },
    android: {
      package: "com.mediary.app",
      edgeToEdgeEnabled: true,
    },
    web: {
      bundler: "metro",
      output: "single",
    },
    plugins: ["expo-router", "expo-secure-store", "expo-web-browser"],
    extra: {
      // On a phone, localhost is the phone: point this at the machine's
      // address on the network (http://192.168.1.20:3002), or 10.0.2.2 from
      // the Android emulator.
      apiUrl: read("EXPO_PUBLIC_API_URL") ?? "http://localhost:3002",
      siteUrl: read("EXPO_PUBLIC_SITE_URL", "NEXT_PUBLIC_SITE_URL") ?? "https://mediary.com",
      clerkPublishableKey: read("EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY", "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"),
    },
  },
};
