import { defineCloudflareConfig } from "@opennextjs/cloudflare/config";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doShardedTagCache from "@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache";

const baseConfig = defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  tagCache: doShardedTagCache,
});

export default {
  ...baseConfig,
  functions: {
    parser: {
      override: baseConfig.default.override,
      routes: [
        "app/api/resume/claim/route",
        "app/api/resume/retry/route",
        "app/api/test-unpdf/route",
      ],
      patterns: ["/api/resume/claim", "/api/resume/retry", "/api/test-unpdf"],
    },
  },
};
