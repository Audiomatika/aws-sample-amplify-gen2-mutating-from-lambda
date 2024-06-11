import { util, extensions } from "@aws-appsync/utils"

export function request(ctx) {
  console.log('resolver(receiveUpdatedStatus)#request', ctx);
  return { payload: null };
}

export const response = (ctx) => {
  console.log('resolver(receiveUpdatedStatus)#response', ctx);
  const filter = {
    owner: {
      eq: ctx.identity.sub
    }
  };

  extensions.setSubscriptionFilter(util.transform.toSubscriptionFilter(filter));

  return ctx.result;
};