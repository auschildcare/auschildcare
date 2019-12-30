import ec2 = require('@aws-cdk/aws-ec2')
import route53 = require('@aws-cdk/aws-route53')
import route53Targets = require('@aws-cdk/aws-route53-targets')
import elbv2 = require('@aws-cdk/aws-elasticloadbalancingv2')
import acm = require('@aws-cdk/aws-certificatemanager')
import cdk = require('@aws-cdk/core')

interface AlbStackProps extends cdk.StackProps {
  stackEnv: string
  vpc: ec2.IVpc
  domainNames: string[]
}

export class AlbStack extends cdk.Stack {
  public readonly alb: elbv2.ApplicationLoadBalancer

  constructor(scope: cdk.App, id: string, props: AlbStackProps) {
    super(scope, id, props)

    // Create ALB
    this.alb = new elbv2.ApplicationLoadBalancer(this, 'alb', {
      vpc: props.vpc,
      internetFacing: true,
    })

    const certificateArns = []

    for (const domainName of props.domainNames) {
      // Lookup HostedZone
      const hostedZone = route53.HostedZone.fromLookup(this, `hostedZone-${domainName}`, {
        domainName: domainName,
      })

      // Create DnsRecord
      new route53.ARecord(this, `dnsRecord-${domainName}`, {
        zone: hostedZone,
        recordName: domainName,
        target: route53.RecordTarget.fromAlias(new route53Targets.LoadBalancerTarget(this.alb)),
      })

      // Create Cert
      certificateArns.push(new acm.DnsValidatedCertificate(this, `siteCertificate-${domainName}`, {
        domainName: domainName,
        hostedZone: hostedZone,
      }).certificateArn)
    }

    // Create Default TargetGroup
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'targetGroup', {
      vpc: props.vpc,
      port: 80,
      targetType: elbv2.TargetType.INSTANCE,
    })

    // Create Public Listener
    const listener = this.alb.addListener('listener', {
      port: 443, // HTTPS
      open: true,
      defaultTargetGroups: [targetGroup],
      certificateArns,
    })
    listener.addFixedResponse('fixedResponse', {
      priority: 5,
      pathPattern: '/ok',
      contentType: elbv2.ContentType.TEXT_PLAIN,
      messageBody: 'OK',
      statusCode: '200',
    })

    const httpListener = this.alb.addListener('httpListener', {
      protocol: elbv2.ApplicationProtocol.HTTP,
    })
    httpListener.addFixedResponse('dummyResponse', {
      statusCode: '404',
    })

    const cfnHttpListener = httpListener.node.defaultChild as elbv2.CfnListener
    cfnHttpListener.defaultActions = [
      {
        type: 'redirect',
        redirectConfig: {
          protocol: 'HTTPS',
          host: '#{host}',
          path: '/#{path}',
          query: '#{query}',
          port: '443',
          statusCode: 'HTTP_301',
        },
      },
    ]

    // Outputs
    new cdk.CfnOutput(this, 'albArn', {
      exportName: `${props.stackEnv}-albArn`,
      value: this.alb.loadBalancerArn,
    })
    new cdk.CfnOutput(this, 'albDnsName', {
      exportName: `${props.stackEnv}-albDnsName`,
      value: this.alb.loadBalancerDnsName,
    })
    new cdk.CfnOutput(this, 'albCanonicalHostedZoneId', {
      exportName: `${props.stackEnv}-albCanonicalHostedZoneId`,
      value: this.alb.loadBalancerCanonicalHostedZoneId,
    })
    new cdk.CfnOutput(this, 'albSecurityGroupId', {
      exportName: `${props.stackEnv}-albSecurityGroupId`,
      value: this.alb.connections.securityGroups[0].securityGroupId,
    })
    new cdk.CfnOutput(this, 'listenerArn', {
      exportName: `${props.stackEnv}-listenerArn`,
      value: listener.listenerArn,
    })
  }
}
