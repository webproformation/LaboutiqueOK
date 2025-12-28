"use client";

import { ApolloProvider } from '@apollo/client/react';
import { ReactNode } from 'react';
import apolloClient from '@/lib/apollo-client';

export default function ApolloWrapper({ children }: { children: ReactNode }) {
  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
}
