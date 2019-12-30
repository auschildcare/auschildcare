import ecr = require('@aws-cdk/aws-ecr')
import cdk = require('@aws-cdk/core')

export interface EcrStackProps extends cdk.StackProps {
  stackEnv: string
  repositoryName: string
}

export class EcrStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: EcrStackProps) {
    super(scope, id, props)

    const repository = new ecr.Repository(this, 'repository', {
      repositoryName: props.repositoryName,
    })

    repository.addLifecycleRule({
      maxImageAge: cdk.Duration.days(1),
      tagStatus: ecr.TagStatus.UNTAGGED,
      description: 'Expire untagged images after 1 day',
    })

    new cdk.CfnOutput(this, 'repositoryUri', {
      value: repository.repositoryUri,
    })
  }
}
