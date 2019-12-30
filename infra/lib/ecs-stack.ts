import ec2 = require('@aws-cdk/aws-ec2')
import elbv2 = require('@aws-cdk/aws-elasticloadbalancingv2')
import ecs = require('@aws-cdk/aws-ecs')
import cdk = require('@aws-cdk/core')

interface EcsStackProps extends cdk.StackProps {
  stackEnv: string
  vpc: ec2.IVpc
  instanceType: string
  alb: elbv2.IApplicationLoadBalancer
}

export class EcsStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: EcsStackProps) {
    super(scope, id, props)

    // Create an ECS cluster
    const cluster = new ecs.Cluster(this, 'cluster', {
      vpc: props.vpc,
    })

    // Add capacity to it
    // TODO: use custom asg https://docs.aws.amazon.com/cdk/api/latest/docs/aws-ecs-readme.html
    cluster.addCapacity('asgCapacity', {
      // using public
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      instanceType: new ec2.InstanceType(props.instanceType),
      desiredCapacity: 1, // 0 for shutdown
      minCapacity: 1, // 0 for shutdown
      maxCapacity: 2,
    })

    // Add SecurityGroup Egress rule
    const clusterSecurityGroupId = cluster.connections.securityGroups[0]
    const albSecurityGroup = props.alb.connections.securityGroups[0]
    albSecurityGroup.addEgressRule(
      clusterSecurityGroupId,
      ec2.Port.tcpRange(32768, 65535),
      'Allow ephemeral port range outbound traffic to instances',
    )

    // Outputs
    new cdk.CfnOutput(this, 'clusterName', {
      exportName: `${props.stackEnv}-clusterName`,
      value: cluster.clusterName,
    })
    new cdk.CfnOutput(this, 'clusterSecurityGroupId', {
      exportName: `${props.stackEnv}-clusterSecurityGroupId`,
      value: cluster.connections.securityGroups[0].securityGroupId,
    })
  }
}
