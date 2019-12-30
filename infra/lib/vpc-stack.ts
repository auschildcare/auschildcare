import ec2 = require('@aws-cdk/aws-ec2')
import cdk = require('@aws-cdk/core')

export interface VpcStackProps extends cdk.StackProps {
  stackEnv: string
}

export class VpcStack extends cdk.Stack {
  public readonly vpc: ec2.IVpc

  constructor(scope: cdk.App, id: string, props: VpcStackProps) {
    super(scope, id, props)

    // Create a VPC
    this.vpc = new ec2.Vpc(this, 'VPC', {
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'ingress',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 26,
          name: 'isolated',
          subnetType: ec2.SubnetType.ISOLATED,
        },
      ],
    })


    // Outputs
    new cdk.CfnOutput(this, 'vpcId', {
      exportName: `${props.stackEnv}-vpcId`,
      value: this.vpc.vpcId,
    })
  }
}
