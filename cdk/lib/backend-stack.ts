import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import {
  HttpApi,
  CorsHttpMethod,
  DomainName,
} from '@aws-cdk/aws-apigatewayv2-alpha';
import { HttpLambdaIntegration } from '@aws-cdk/aws-apigatewayv2-integrations-alpha';

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
    const apiDomain = `${apiSubDomain}.${domainName}`;

    const zone = route53.HostedZone.fromLookup(this, 'Zone', { domainName });

    const apiCertificate = new acm.Certificate(this, 'ApiCertificate', {
      domainName: apiDomain,
      validation: acm.CertificateValidation.fromDns(zone),
    });

    const apiDomainName = new DomainName(this, 'ApiDomainName', {
      domainName: apiDomain,
      certificate: apiCertificate,
    });

    // Users table: matches schema from backend createTables (user_id PK, status GSI)
    // Table name must be unique per account/region, so namespace by stage
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: stage === 'staging' ? 'Users-staging' : 'Users',
      partitionKey: { name: 'user_id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
    usersTable.addGlobalSecondaryIndex({
      indexName: 'status-index',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const backendFn = new NodejsFunction(this, 'BackendFn', {
      entry: path.join(__dirname, '../../backend/src/lambda.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      bundling: {
        forceDockerBundling: false,
      },
      environment: {
        CORS_ORIGIN: frontendOrigin,
        CLERK_SECRET_KEY: clerkSecretKey,
        CLERK_PUBLISHABLE_KEY: clerkPublishableKey,
        USERS_TABLE: usersTable.tableName,
        OTEL_METRICS_EXPORTER: "awsemf",
        OTEL_TRACES_SAMPLER:"traceidratio",
        // OTEL_TRACES_SAMPLER_ARG:"0.3",
        OTEL_TRACES_SAMPLER_ARG:"1.0",
      },
      tracing: lambda.Tracing.ACTIVE,
      layers: [
        lambda.LayerVersion.fromLayerVersionArn(
          this,
          'AwsOtelLayer',
          `arn:aws:lambda:${this.region}:901920570463:layer:aws-otel-nodejs-amd64-ver-1-30-2:1`
        ),
      ],
    });
    backendFn.addEnvironment('AWS_LAMBDA_EXEC_WRAPPER', '/opt/otel-instrument');
    backendFn.addEnvironment('OTEL_SERVICE_NAME', 'download-gate-api');
    backendFn.addEnvironment(  
      'OTEL_RESOURCE_ATTRIBUTES',  
      'service.namespace=download-gate,deployment.environment=production'  
    );  
    backendFn.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'CloudWatchLambdaApplicationSignalsExecutionRolePolicy'
      )
    );

    // Optional: send traces to Grafana Cloud OTLP in addition to X-Ray (custom collector config)
    if (grafanaCloudOtlp) {
      const otelConfigBucket = new s3.Bucket(this, 'OtelConfigBucket', {
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      });
      // const collectorConfig = `\
      // # ADOT collector: X-Ray + Grafana Cloud OTLP (env vars substituted at runtime)
      //                           receivers:
      //                             otlp:
      //                               protocols:
      //                                 grpc:
      //                                   endpoint: localhost:4317
      //                                 http:
      //                                   endpoint: localhost:4318
      //                           exporters:
      //                             awsxray:
      //                               region: ${this.region}
      //                             otlphttp/grafana:
      //                               endpoint: \${env:GRAFANA_CLOUD_OTLP_ENDPOINT}
      //                               headers:
      //                                 Authorization: \${env:GRAFANA_CLOUD_OTLP_AUTH}
      //                           service:
      //                             pipelines:
      //                               traces:
      //                                 receivers: [otlp]
      //                                 exporters: [awsxray, otlphttp/grafana]
      //                             telemetry:
      //                               metrics:
      //                                 address: localhost:8888
      //                           `;
      const collectorConfig = `\  
      receivers:  
        otlp:  
          protocols:  
            grpc:  
              endpoint: localhost:4317  
            http:  
              endpoint: localhost:4318  
      exporters:  
        awsxray:  
          region: ${this.region}  
        otlphttp/grafana:  
          endpoint: \${env:GRAFANA_CLOUD_OTLP_ENDPOINT}  
          headers:  
            Authorization: \${env:GRAFANA_CLOUD_OTLP_AUTH}  
      service:  
        pipelines:  
          traces:  
            receivers: [otlp]  
            exporters: [awsxray, otlphttp/grafana]  
      `;  
      new s3deploy.BucketDeployment(this, 'OtelConfigDeployment', {
        destinationBucket: otelConfigBucket,
        sources: [s3deploy.Source.data('collector.yaml', collectorConfig)],
      });
      otelConfigBucket.grantRead(backendFn);
      backendFn.addEnvironment(
        'OPENTELEMETRY_COLLECTOR_CONFIG_URI',
        `s3://${otelConfigBucket.bucketName}/collector.yaml`
      );
      backendFn.addEnvironment(
        'GRAFANA_CLOUD_OTLP_ENDPOINT',
        grafanaCloudOtlp.endpoint
      );
      backendFn.addEnvironment(
        'GRAFANA_CLOUD_OTLP_AUTH',
        grafanaCloudOtlp.auth
      );
    }

    usersTable.grantReadWriteData(backendFn);

    const integration = new HttpLambdaIntegration('LambdaIntegration', backendFn);

    const api = new HttpApi(this, 'DownloadGateApi', {
      defaultIntegration: integration,
      corsPreflight: {
        allowOrigins: [frontendOrigin],
        allowMethods: [
          CorsHttpMethod.GET,
          CorsHttpMethod.POST,
          CorsHttpMethod.PUT,
          CorsHttpMethod.PATCH,
          CorsHttpMethod.DELETE,
          CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: [
          'Content-Type',
          'Authorization',
          // OpenTelemetry W3C trace context (required when OTEL/ADOT propagates trace headers from browser)
          'traceparent',
          'tracestate',
          'baggage',
        ],
      },
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
