import { defineConfig } from 'orval'

const openApiUrl =
  process.env.CLUTCHA_OPENAPI_URL ?? 'http://localhost:3000/docs/openapi.json'

export default defineConfig({
  clutcha: {
    input: {
      target: openApiUrl,
    },
    output: {
      target: './src/api/generated/clutcha.ts',
      schemas: {
        path: './src/api/generated',
        splitByTags: true,
      },
      client: 'react-query',
      httpClient: 'axios',
      mode: 'tags-split',
      clean: true,
      override: {
        mutator: {
          path: './src/services/http/api-client.ts',
          name: 'clutchaApiClient',
        },
      },
    },
  },
})
