import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

const schema = a.schema({
  Device: a.model({
    name: a.string(),
    isConnect: a.boolean(),
  })
  .authorization( allow => [allow.owner()] ),

  updateConnectionStatus: a.mutation()
  .arguments({
    id: a.id().required(),
    isConnect: a.boolean(),
  })
  .returns(a.ref('Device'))
  .authorization( allow => [allow.authenticated()] )
  .handler(
    a.handler.custom({
      dataSource: a.ref('Device'),
      entry: './updateConnectionStatus.js',
    })
  ),

  receiveUpdatedStatus: a.subscription()
    .for(a.ref('updateConnectionStatus'))
    .authorization( allow => [allow.authenticated()] )
    .handler(
      a.handler.custom({
        entry: './receiveUpdatedStatus.js',
      })
    ),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  }
});
