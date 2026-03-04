# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Deploying without CD (local .env)

You can deploy to **staging** or **production** from your machine using `.env` files instead of GitHub Actions.

1. **Production** – use `cdk/.env` (your current file). From the `cdk` directory:
   ```bash
   npm run deploy:production
   ```
   or `npx cdk deploy --all --require-approval never`

2. **Staging** – create `cdk/.env.staging` with staging values (domain, Clerk keys, repo, Grafana, etc.). Then:
   ```bash
   npm run deploy:staging
   ```
   or `STAGE=staging npx cdk deploy --all --require-approval never`

The app loads env from `.env.staging` when `STAGE=staging`, and from `.env` when deploying to production. Ensure AWS credentials are configured (e.g. `aws configure` or `AWS_PROFILE`).

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npm run deploy`  deploy all stacks (uses current .env)
* `npm run deploy:staging`  deploy to staging (uses .env.staging)
* `npm run deploy:production`  deploy to production (uses .env)
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
