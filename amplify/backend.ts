import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { ddbStreamsTriggerFunction } from './function/ddb-streams-trigger/resource';
import * as cdk from 'aws-cdk-lib';

const backend = defineBackend({
  auth,
  data,
  ddbStreamsTriggerFunction,
});

// DynamoDB Streams の表示タイプを設定
// (https://docs.aws.amazon.com/ja_jp/amazondynamodb/latest/developerguide/Streams.html#Streams.Enabling)
backend.data.resources.cfnResources.amplifyDynamoDbTables.Device.streamSpecification = {
  streamViewType: cdk.aws_dynamodb.StreamViewType.NEW_IMAGE,
};

// Lambda のトリガーとなるイベントソースとして DynamoDB Streams を設定
const eventSource = new cdk.aws_lambda_event_sources.DynamoEventSource(backend.data.resources.tables['Device'], {
  startingPosition: cdk.aws_lambda.StartingPosition.LATEST,
});
backend.ddbStreamsTriggerFunction.resources.lambda.addEventSource(eventSource);

// Lambda に AppSync GraphQL API を実行する権限を与える
backend.data.resources.graphqlApi.grant(
  backend.ddbStreamsTriggerFunction.resources.lambda,
  cdk.aws_appsync.IamResource.all(),
  'appsync:GraphQL'
);

// Lambda 関数の環境変数に AppSync のエンドポイント URL を設定
backend.ddbStreamsTriggerFunction.resources.cfnResources.cfnFunction.environment = {
  variables: {
    ENDPOINT: backend.data.resources.cfnResources.cfnGraphqlApi.attrGraphQlUrl,
  }
};