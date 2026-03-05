import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as fs from 'fs';
import * as path from 'path';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import {
  HttpApi,
  DomainName,
} from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';
import * as cr from 'aws-cdk-lib/custom-resources';

/** Optional Grafana Cloud OTLP destination (traces sent in addition to X-Ray). */
export interface GrafanaCloudOtlpConfig {
  /** Grafana Cloud OTLP endpoint, e.g. https://otlp-gateway-XXX.grafana.net/otlp */
  endpoint: string;
  /** Authorization header value, e.g. "Basic <base64(instanceId:apiKey)>". Prefer SSM/Secrets Manager. */
  auth: string;
}

interface BackendStackProps extends cdk.StackProps {
  domainName: string;
  siteSubDomain: string;
  apiSubDomain: string;
  /** Stage (e.g. 'staging' | 'production') - used for resource namespacing */
  stage: string;
  /** Clerk secret key (e.g. from env). Prefer SSM/Secrets Manager in production. */
  clerkSecretKey: string;
  /** Clerk publishable key (e.g. from env). */
  clerkPublishableKey: string;
  /** Optional: send OTLP traces to Grafana Cloud (in addition to X-Ray and CloudWatch). */
  grafanaCloudOtlp?: GrafanaCloudOtlpConfig;
}

export class BackendStack extends cdk.Stack {
  public readonly apiUrl: string;

  constructor(scope: Construct, id: string, props: BackendStackProps) {
    super(scope, id, props);

    const {
      domainName,
      siteSubDomain,
      apiSubDomain,
      stage,
      clerkSecretKey,
      clerkPublishableKey,
      grafanaCloudOtlp,
    } = props;
    const frontendOrigin = `https://${siteSubDomain}.${domainName}`;
    const apexOrigin = `https://${domainName}`;
    // Allow both subdomain (e.g. www) and apex so CORS works from either
    const corsOrigins = [frontendOrigin, apexOrigin].filter(
      (o, i, a) => a.indexOf(o) === i
    );
    const apiDomain = `${apiSubDomain}.${domainName}`;

    const zone = route53.HostedZone.fromLookup(this, 'Zone', { domainName });

    const apiCertificate = new acm.Certificate(this, 'ApiCertificate', {
      domainName: apiDomain,
      validation: acm.CertificateValidation.fromDns(zone),
    });
    // Retain certificate on stack destroy so deletion order (DomainName → Certificate) doesn't
    // cause "Certificate is in use" failures; you can delete the certificate manually in ACM if needed.
    apiCertificate.applyRemovalPolicy(cdk.RemovalPolicy.RETAIN);

    const apiDomainName = new DomainName(this, 'ApiDomainName', {
      domainName: apiDomain,
      certificate: apiCertificate,
    });

    // Table schemas: single source of truth in backend/src/db/tableDefinitions.json
    // (also used by backend scripts/createTables.ts for local DynamoDB)
    const tableDefsPath = path.join(__dirname, '../../backend/src/db/tableDefinitions.json');
    const tableDefs = JSON.parse(fs.readFileSync(tableDefsPath, 'utf-8')) as Array<{
      tableName: string;
      envKey?: string;
      partitionKey: { name: string; type: string };
      sortKey?: { name: string; type: string };
      gsis?: Array<{
        indexName: string;
        partitionKey: { name: string; type: string };
        sortKey?: { name: string; type: string };
      }>;
    }>;

    const tables: Record<string, dynamodb.Table> = {};
    for (const def of tableDefs) {
      const tableName = stage === 'staging' ? `${def.tableName}-staging` : def.tableName;
      const table = new dynamodb.Table(this, `${def.tableName.replace(/-/g, '')}Table`, {
        tableName,
        partitionKey: { name: def.partitionKey.name, type: dynamodb.AttributeType.STRING },
        sortKey: def.sortKey
          ? { name: def.sortKey.name, type: dynamodb.AttributeType.STRING }
          : undefined,
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });
      def.gsis?.forEach((gsi) => {
        table.addGlobalSecondaryIndex({
          indexName: gsi.indexName,
          partitionKey: { name: gsi.partitionKey.name, type: dynamodb.AttributeType.STRING },
          sortKey: gsi.sortKey
            ? { name: gsi.sortKey.name, type: dynamodb.AttributeType.STRING }
            : undefined,
          projectionType: dynamodb.ProjectionType.ALL,
        });
      });
      tables[def.tableName] = table;
    }

    const tableEnv: Record<string, string> = {};
    for (const def of tableDefs) {
      const envKey = def.envKey;
      if (envKey) tableEnv[envKey] = tables[def.tableName].tableName;
    }

    const backendFn = new NodejsFunction(this, 'BackendFn', {
      entry: path.join(__dirname, '../../backend/src/lambda.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: {
        forceDockerBundling: false,
      },
      environment: {
        CORS_ORIGINS: corsOrigins.join(','),
        CLERK_SECRET_KEY: clerkSecretKey,
        CLERK_PUBLISHABLE_KEY: clerkPublishableKey,
        ...tableEnv,
      },
      tracing: lambda.Tracing.ACTIVE,
      // ADOT layer + AWS_LAMBDA_EXEC_WRAPPER removed: caused init/runtime issues (e.g. /opt/otel-instrument
      // not present). Re-enable when using a supported Node.js ADOT layer + wrapper path.
    });

    // // Optional: send traces to Grafana Cloud OTLP in addition to X-Ray (custom collector config)
    // if (grafanaCloudOtlp) {
    //   const otelConfigBucket = new s3.Bucket(this, 'OtelConfigBucket', {
    //     blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    //     removalPolicy: cdk.RemovalPolicy.DESTROY,
    //     autoDeleteObjects: true,
    //   });
    //   // # ADOT collector: X-Ray + Grafana Cloud OTLP (env vars substituted at runtime)
    //   const collectorConfig = `\  
    //   receivers:  
    //     otlp:  
    //       protocols:  
    //         grpc:  
    //           endpoint: localhost:4317  
    //         http:  
    //           endpoint: localhost:4318  
    //   exporters:  
    //     awsxray:  
    //       region: ${this.region}  
    //     otlphttp/grafana:  
    //       endpoint: \${env:GRAFANA_CLOUD_OTLP_ENDPOINT}  
    //       headers:  
    //         Authorization: \${env:GRAFANA_CLOUD_OTLP_AUTH}  
    //   service:  
    //     pipelines:  
    //       traces:  
    //         receivers: [otlp]  
    //         exporters: [awsxray, otlphttp/grafana]  
    //   `;  
    //   new s3deploy.BucketDeployment(this, 'OtelConfigDeployment', {
    //     destinationBucket: otelConfigBucket,
    //     sources: [s3deploy.Source.data('collector.yaml', collectorConfig)],
    //   });
    //   otelConfigBucket.grantRead(backendFn);
    //   backendFn.addEnvironment(
    //     'OPENTELEMETRY_COLLECTOR_CONFIG_URI',
    //     `s3://${otelConfigBucket.bucketName}/collector.yaml`
    //   );
    //   backendFn.addEnvironment(
    //     'GRAFANA_CLOUD_OTLP_ENDPOINT',
    //     grafanaCloudOtlp.endpoint
    //   );
    //   backendFn.addEnvironment(
    //     'GRAFANA_CLOUD_OTLP_AUTH',
    //     grafanaCloudOtlp.auth
    //   );
    // }

    for (const def of tableDefs) {
      tables[def.tableName].grantReadWriteData(backendFn);
    }

    // Custom resource: on every Create/Update, verify all DynamoDB tables exist.
    // If tables were deleted outside CloudFormation (e.g. in the console), this fails
    // so the deploy fails instead of succeeding with a broken app.
    const expectedTableNames = tableDefs.map((d) =>
      stage === 'staging' ? `${d.tableName}-staging` : d.tableName
    );
    const tableCheckHandler = new NodejsFunction(this, 'DynamoTableCheckHandler', {
      entry: path.join(__dirname, '../lambdas/dynamo-table-check.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: { forceDockerBundling: false },
      timeout: cdk.Duration.seconds(60),
    });
    tableCheckHandler.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['dynamodb:DescribeTable'],
        resources: ['*'],
      })
    );
    const tableCheckProvider = new cr.Provider(this, 'DynamoTableCheckProvider', {
      onEventHandler: tableCheckHandler,
    });
    const tableCheckResource = new cdk.CustomResource(this, 'DynamoTableCheck', {
      serviceToken: tableCheckProvider.serviceToken,
      properties: {
        TableNames: expectedTableNames,
        // Change each deploy so the custom resource runs on every update (not just when TableNames change)
        DeployTime: new Date().toISOString(),
      },
    });
    for (const def of tableDefs) {
      tableCheckResource.node.addDependency(tables[def.tableName]);
    }

    const integration = new HttpLambdaIntegration('LambdaIntegration', backendFn);

    const api = new HttpApi(this, 'DownloadGateApi', {
      defaultIntegration: integration,
      // Do NOT set corsPreflight: API Gateway would override Lambda's CORS headers and only
      // supports a single origin. Let Lambda/Express handle CORS so it can reflect the request origin.
      defaultDomainMapping: {
        domainName: apiDomainName,
      },
    });

    new route53.ARecord(this, 'ApiAliasRecord', {
      recordName: apiDomain,
      target: route53.RecordTarget.fromAlias(
        new targets.ApiGatewayv2DomainProperties(
          apiDomainName.regionalDomainName,
          apiDomainName.regionalHostedZoneId
        )
      ),
      zone,
    });

    const apiBaseUrl = `https://${apiDomain}`;
    backendFn.addEnvironment('BASE_URL', apiBaseUrl);

    this.apiUrl = apiBaseUrl;

    new cdk.CfnOutput(this, 'ApiUrl', { value: apiBaseUrl });
  }
}
