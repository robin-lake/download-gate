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

After your IAM role is configured, subsequent pushes to main will deploy the full CDK build via Github Actions