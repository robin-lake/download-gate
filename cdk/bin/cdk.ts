#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import * as dotenv from 'dotenv';
import { FrontendStack } from '../lib/frontend-stack';
import { BackendStack } from '../lib/backend-stack';
import { CiIamStack } from '../lib/ci-stack';

const stage = process.env.STAGE || 'production';
if (stage === 'staging') {
  dotenv.config({ path: '.env.staging' });
} else {
  dotenv.config();
}

const app = new cdk.App();
const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION };

const frontendStackId = stage === 'staging' ? 'DownloadGateStagingFrontendStack' : 'DownloadGateFrontendStack';
const backendStackId = stage === 'staging' ? 'DownloadGateStagingBackendStack' : 'DownloadGateBackendStack';

new FrontendStack(app, frontendStackId, {
  domainName: process.env.DOMAIN_NAME as string,
  siteSubDomain: process.env.SITE_SUBDOMAIN as string,
  env,
});

new BackendStack(app, backendStackId, {
  domainName: process.env.DOMAIN_NAME as string,
  siteSubDomain: process.env.SITE_SUBDOMAIN as string,
  apiSubDomain: process.env.API_SUBDOMAIN as string,
  stage,
  clerkSecretKey: process.env.CLERK_SECRET_KEY as string,
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY as string,
  env,
});

// Only create CI IAM stack for production (trust policy allows both main and staging)
if (stage === 'production') {
  new CiIamStack(app, 'DownloadGateCiIamStack', {
    repoName: process.env.REPO_NAME as string,
    repoOwner: process.env.REPO_OWNER as string,
  });
}