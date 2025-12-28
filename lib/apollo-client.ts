import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const httpLink = new HttpLink({
  uri: process.env.NEXT_PUBLIC_WORDPRESS_API_URL,
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache({
    typePolicies: {
      Product: {
        keyFields: ['id'],
      },
      SimpleProduct: {
        keyFields: ['id'],
      },
      VariableProduct: {
        keyFields: ['id'],
      },
      Query: {
        fields: {
          products: {
            keyArgs: ['where'],
            merge(existing, incoming, { args }) {
              if (!args?.after) {
                return incoming;
              }
              const existingNodes = existing?.nodes || [];
              const incomingNodes = incoming?.nodes || [];
              return {
                ...incoming,
                nodes: [...existingNodes, ...incomingNodes],
              };
            },
          },
        },
      },
    },
  }),
  ssrMode: typeof window === 'undefined',
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-first',
      nextFetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

export default client;
