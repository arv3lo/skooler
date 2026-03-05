import { defineConfig } from 'orval';

export default defineConfig({
  skool: {
    input: {
      target: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/docs-json`,
    },
    output: {
      mode: 'tags-split',
      target: 'api/generated',
      client: 'react-query',
      httpClient: 'fetch',
      override: {
        mutator: {
          path: 'lib/api-client.ts',
          name: 'apiClient',
        },
        query: {
          useQuery: true,
          useMutation: true,
        },
      },
      schemas: 'api/model',
    },
  },
});
