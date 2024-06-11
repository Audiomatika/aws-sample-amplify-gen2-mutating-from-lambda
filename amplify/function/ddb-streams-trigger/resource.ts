import { defineFunction } from '@aws-amplify/backend';

export const ddbStreamsTriggerFunction = defineFunction({
  name: "ddb-streams-trigger",
  entry: './handler.ts',
});
