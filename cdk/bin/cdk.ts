#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import 'dotenv/config'
import { FrontendStack } from '../lib/frontend-stack';
import { BackendStack } from '../lib/backend-stack';
import { CiIamStack } from '../lib/ci-stack';

const app = new cdk.App();
new FrontendStack(app, 'DownloadGateFrontendStack', {
  domainName: process.env.DOMAIN_NAME as string,
  siteSubDomain: process.env.SITE_SUBDOMAIN as string,
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});

new BackendStack(app, 'DownloadGateBackendStack', {
  domainName: process.env.DOMAIN_NAME as string,
  siteSubDomain: process.env.SITE_SUBDOMAIN as string,
  apiSubDomain: process.env.API_SUBDOMAIN as string,
  clerkSecretKey: process.env.CLERK_SECRET_KEY as string,
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY as string,
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

new CiIamStack(app, 'DownloadGateCiIamStack', {
  repoName: process.env.REPO_NAME as string,
  repoOwner: process.env.REPO_OWNER as string,
})