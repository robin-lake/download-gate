import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';

interface CiIamStackProps extends cdk.StackProps {
    repoOwner: string;
    repoName: string
}

export class CiIamStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: CiIamStackProps) {
    super(scope, id, props);
    const {repoOwner, repoName} = props

    // GitHub OIDC provider
    const provider = new iam.OpenIdConnectProvider(this, 'GitHubProvider', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
    });

    // const repoOwner = 'your-github-username-or-org';
    // const repoName = 'download-gate';

    // Single wildcard allows main and staging (and any branch); avoids IAM array condition issues
    const githubPrincipal = new iam.WebIdentityPrincipal(provider.openIdConnectProviderArn, {
      StringLike: {
        'token.actions.githubusercontent.com:sub': `repo:${repoOwner}/${repoName}:ref:refs/heads/*`,
      },
      StringEquals: {
        'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
      },
    });

    const role = new iam.Role(this, 'GithubActionsRole', {
      assumedBy: githubPrincipal,
      description: 'Role assumed by GitHub Actions for CDK deploys',
    });

    // Grant whatever CDK needs to deploy your stacks
    role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess')
      // or a tighter custom policy
    );

    new cdk.CfnOutput(this, 'GithubActionsRoleArn', {
      value: role.roleArn,
    });
  }
}