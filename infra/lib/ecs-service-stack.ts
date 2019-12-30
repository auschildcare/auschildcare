import route53 = require('@aws-cdk/aws-route53')
import elbv2 = require('@aws-cdk/aws-elasticloadbalancingv2')
import ec2 = require('@aws-cdk/aws-ec2')
import logs = require('@aws-cdk/aws-logs')
import ecs = require('@aws-cdk/aws-ecs')
import ecr = require('@aws-cdk/aws-ecr')
import acm = require('@aws-cdk/aws-certificatemanager')
import cdk = require('@aws-cdk/core')

interface EcsServiceStackProps extends cdk.StackProps {
  stackEnv: string
  vpc: ec2.IVpc
  domainName: string
  cnameRecord?: string
  repositoryName: string
  imageTag?: string
  priority: number
  containerPort: number
  cpu: number
  memoryLimitMiB: number
  environment?: {
    [key: string]: string;
  }
}

export class EcsServiceStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: EcsServiceStackProps) {
    super(scope, id, props)

    // Lookup ClusterSecurityGroup
    const clusterSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      'clusterSecurityGroup',
      cdk.Fn.importValue(`${props.stackEnv}-clusterSecurityGroupId`),
    )

    // Lookup Cluster
    const cluster = ecs.Cluster.fromClusterAttributes(this, 'cluster', {
      clusterName: cdk.Fn.importValue(`${props.stackEnv}-clusterName`),
      vpc: props.vpc,
      securityGroups: [clusterSecurityGroup],
    })

    // Lookup Repository
    const repository = ecr.Repository.fromRepositoryName(this, 'repository', props.repositoryName)

    // Create Task Definition
    const taskDefinition = new ecs.Ec2TaskDefinition(this, 'taskDef', {
      networkMode: ecs.NetworkMode.BRIDGE,
    })
    // use repositoryName as container name
    const container = taskDefinition.addContainer(props.repositoryName, {
      image: ecs.ContainerImage.fromEcrRepository(repository, props.imageTag),
      cpu: props.cpu,
      memoryLimitMiB: props.memoryLimitMiB,
      logging: new ecs.AwsLogDriver({
        streamPrefix: props.stackEnv,
        logRetention: logs.RetentionDays.ONE_WEEK,
      }),
      environment: {
        STACK_ENVIRONMENT: props.stackEnv,
        // port as string env var
        PORT: props.containerPort + '',
      },
    })
    container.addPortMappings({
      containerPort: props.containerPort,
    })

    // Create Service
    const service = new ecs.Ec2Service(this, 'service', {
      cluster,
      taskDefinition,
      desiredCount: 1,
      assignPublicIp: false,
    })

    // Attach ALB to ECS Service
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'targetGroup', {
      vpc: props.vpc,
      port: props.containerPort,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [service],
      healthCheck: {
        interval: cdk.Duration.seconds(60),
        timeout: cdk.Duration.seconds(5),
        path: '/',
      },
    })

    // Lookup Listener
    const listener = elbv2.ApplicationListener.fromApplicationListenerAttributes(this, 'listener', {
      listenerArn: cdk.Fn.importValue(`${props.stackEnv}-listenerArn`),
      securityGroupId: cdk.Fn.importValue(`${props.stackEnv}-albSecurityGroupId`),
    })

    // Create Listener Rule
    const listenerRule = new elbv2.ApplicationListenerRule(this, 'listenerRule', {
      priority: props.priority,
      hostHeader: props.cnameRecord ? `${props.cnameRecord}.${props.domainName}` : props.domainName,
      targetGroups: [targetGroup],
      listener,
    })

    // Lookup HostedZone
    const hostedZone = route53.HostedZone.fromLookup(this, 'hostedZone', {
      domainName: props.domainName,
    })

    // Create Cname if required
    if (props.cnameRecord) {
      new route53.CnameRecord(this, 'cnameRecord', {
        zone: hostedZone,
        recordName: props.cnameRecord,
        domainName: props.domainName,
      })
      const certificateArn = new acm.DnsValidatedCertificate(this, 'siteCertificate', {
        domainName: `${props.cnameRecord}.${props.domainName}`,
        hostedZone: hostedZone,
      }).certificateArn
      new elbv2.ApplicationListenerCertificate(this, 'listenerCertificate', {
        listener,
        certificateArns: [certificateArn],
      })
    }

    // Outputs
    new cdk.CfnOutput(this, 'serviceName', { value: service.serviceName })
    new cdk.CfnOutput(this, 'targetGroupName', {
      value: targetGroup.targetGroupName,
    })
    new cdk.CfnOutput(this, 'listenerRuleArn', {
      value: listenerRule.listenerRuleArn,
    })
  }
}
