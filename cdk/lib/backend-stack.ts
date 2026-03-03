import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
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
        OTEL_TRACES_SAMPLER_ARG:"0.3",
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
    backendFn.role?.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'CloudWatchLambdaApplicationSignalsExecutionRolePolicy'
      )
    );
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
        allowHeaders: ['Content-Type', 'Authorization'],
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
