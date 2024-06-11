import { util } from "@aws-appsync/utils";
import * as ddb from "@aws-appsync/utils/dynamodb";

export function request(ctx) {
  console.log('resolver(updateConnectionStatus)#request', ctx);
  const { id } = ctx.args;
  return ddb.get({ key: { id }});
}

export function response(ctx) {
  console.log('resolver(updateConnectionStatus)#response', ctx);

  const { error, result } = ctx;
  if (error) {
    return util.appendError(error.message, error.type, result)
  }
  return ctx.result
}
