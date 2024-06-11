import { default as fetch, Request } from 'node-fetch';
import { HttpRequest } from '@smithy/protocol-http';
import { SignatureV4 } from '@smithy/signature-v4';
import { Sha256 } from '@aws-crypto/sha256-universal';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import type { DynamoDBStreamHandler } from 'aws-lambda';

const ENDPOINT = process.env.ENDPOINT!;
const AWS_REGION = process.env.AWS_REGION!;

// Mutation クエリ
const query = `mutation updateConnectionStatus($id: ID!, $isConnect: Boolean) {
  updateConnectionStatus(id: $id, isConnect: $isConnect){
    id
    owner
    name
    isConnect
    createdAt
    updatedAt
  }
}`;

const appSyncEndpoint = new URL(ENDPOINT);

export const handler: DynamoDBStreamHandler = async (event) => {
  console.debug(JSON.stringify(event));

  // SigV4 での Signer 生成
  const sigV4Signer = new SignatureV4({
    credentials: defaultProvider(),
    region: AWS_REGION,
    service: 'appsync',
    sha256: Sha256,
  });

  // 失敗した項目だけを Streams に報告するための配列
  // https://docs.aws.amazon.com/ja_jp/lambda/latest/dg/with-ddb.html#services-ddb-batchfailurereporting
  const batchItemFailures: DynamoDBBatchItemFailure[] = [];

  for (const record of event.Records) {
    if (record.eventName !== 'MODIFY') {
      continue;
    }

    // DynamoDB Streams から更新された情報を取得
    const newImage = record.dynamodb?.NewImage;
    const variables = {
      id: newImage?.id.S,
      isConnect: newImage?.isConnect.BOOL,
    };

    // SigV4 署名リクエストを作成
    const httpRequest = new HttpRequest({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        host: appSyncEndpoint.host,
      },
      hostname: appSyncEndpoint.host,
      body: JSON.stringify({ query, variables }),
      path: appSyncEndpoint.pathname,
    });
    const signedRequest = await sigV4Signer.sign(httpRequest);

    // AppSync のエンドポイントへリクエスト
    const request = new Request(ENDPOINT, signedRequest);

    try {
      const response = await fetch(request);
      const body = await response.json();

      if (body.errors){
        console.error(body);
        batchItemFailures.push(record.dynamodb!.SequenceNumber!);
      }
    }
    catch (error) {
      console.error(error);
      batchItemFailures.push(record.dynamodb!.SequenceNumber!);
    }
  }

  return { batchItemFailures };
};