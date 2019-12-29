import s3 = require('@aws-cdk/aws-s3')
import cdk = require('@aws-cdk/core')

export interface S3StackProps extends cdk.StackProps {
  stackEnv: string
  bucketName: string
}

export class S3Stack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: S3StackProps) {
    super(scope, id, props)

    const bucket = new s3.Bucket(this, 'bucket', {
      versioned: false,
      bucketName: props.bucketName,
      encryption: s3.BucketEncryption.UNENCRYPTED,
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      // lifecycleRules: [
      //   {
      //     // TODO: confirm deletion policy
      //     prefix: 'pod/',
      //     // expiration: cdk.Duration.days(365),
      //     transitions: [
      //       {
      //         storageClass: s3.StorageClass.INFREQUENT_ACCESS,
      //         transitionAfter: cdk.Duration.days(60),
      //       },
      //       // {
      //       //   storageClass: s3.StorageClass.GLACIER,
      //       //   transitionAfter: cdk.Duration.days(120),
      //       // },
      //     ],
      //   },
      // ],
    })

    new cdk.CfnOutput(this, 'bucketDomainName', {
      exportName: `${props.stackEnv}-bucketDomainName`,
      value: bucket.bucketDomainName,
    })
    new cdk.CfnOutput(this, 'bucketWebsiteDomainName', {
      exportName: `${props.stackEnv}-bucketWebsiteDomainName`,
      value: bucket.bucketWebsiteDomainName,
    })
    new cdk.CfnOutput(this, 'bucketArn', {
      exportName: `${props.stackEnv}-bucketArn`,
      value: bucket.bucketArn,
    })
  }
}
