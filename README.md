#Download Gate#

###Deploying via AWS CDK###
To configue the app for deployment via the AWS CDK, first add the following lines to your environment variables file in `cdk/.env`:
```
DOMAIN_NAME=your-domain
SITE_SUBDOMAIN=your-subdomain
API_SUBDOMAIN=your-api-subdomain

CLERK_PUBLISHABLE_KEY=your-publishable-key
CLERK_SECRET_KEY=your-secret-key
```
The frontend can be deployed by running
``` 
cd cdk
npx cdk deploy DownloadGateFrontendStack
```
The backend can be deployed by running
```
cd cdk
npx cdk deploy DownloadGateBackendStack
```

###Setting Up CI/CD###
In order to set up CI/CD, add these lines to your variables file in `cdk/.env`:

```
REPO_NAME=your-repo-name
REPO_OWNER=your-github-user
```

Run the CiIamStack once from your cdk directory
```
cd cdk
npm install
npx cdk deploy DownloadGateCiIamStack
```

You will see an output in the terminal that looks like this:
```
DownloadGateCiIamStack.GithubActionsRoleArn = arn:aws:iam::{your-aws-account}:role/DownloadGateCiIamStack-GithubActionsRole{some-string}
```

Copy it to your Github secrets. Go to Github --> Settings --> Secrets and variabls --> Actions. Create a secret named ```AWS_GITHUB_ROLE_ARN``` and copy the calue from above.

After your IAM role is configured, subsequent pushes to main will deploy the full CDK build via Github Actions.

### Staging Deployments
Pushes to the `staging` branch deploy a separate staging environment. Configure a **staging** environment in GitHub (Settings → Environments) with the same `AWS_GITHUB_ROLE_ARN` secret and staging-specific variables: `DOMAIN_NAME`, `SITE_SUBDOMAIN`, `API_SUBDOMAIN`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`. The CI IAM role trusts both `main` and `staging`; re-deploy `DownloadGateCiIamStack` once from main after enabling staging so the updated trust policy is applied.

### Adding Music Provider Integrations ###

Each of the music services requires an api key. Here are the steps for connecting them.

#### SoundCloud ####
Go to https://soundcloud.com/you/apps
Register a new app
Copy Client Id and Client Secret into your Github environment variables as `SOUNDCLOUD_CLIENT_ID` and `SOUNDCLOUD_CLIENT_SECRET`