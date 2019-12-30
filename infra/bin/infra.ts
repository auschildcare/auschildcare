#!/usr/bin/env node
import cdk = require('@aws-cdk/core')
import { BudgetStack } from '../lib/budget-stack'
import { S3Stack } from '../lib/s3-stack'
import { VpcStack } from '../lib/vpc-stack'
import { AlbStack } from '../lib/alb-stack'
import { EcrStack } from '../lib/ecr-stack'
import { EcsStack } from '../lib/ecs-stack'
import { EcsServiceStack } from '../lib/ecs-service-stack'

const env = {
  account: '874536534479', // auschildcare
  region: 'ap-southeast-2', // Sydney
}

const stackEnv = 'prod'

const auschildcare = {
  domainName: 'auschildcare.com',
  ecrRepositoryName: 'auschildcare-landing',
  s3BucketName: 'auschildcare-static',
}

const app = new cdk.App()

const budget = new BudgetStack(app, `${stackEnv}-budget`, {
  env,
  stackEnv,
  monthlyBudgetAmount: 10,
  emailAddresses: ['auschildcare2020@gmail.com'],
})

const s3 = new S3Stack(app, `${stackEnv}-s3`, {
  env,
  stackEnv,
  bucketName: auschildcare.s3BucketName,
})

const vpcStack = new VpcStack(app, `${stackEnv}-vpc`, {
  env,
  stackEnv,
})
const vpc = vpcStack.vpc

const ecr = new EcrStack(app, `${stackEnv}-ecr`, {
  env,
  stackEnv,
  repositoryName: auschildcare.ecrRepositoryName,
})

const albStack = new AlbStack(app, `${stackEnv}-alb`, {
  env,
  stackEnv,
  vpc,
  domainNames: [auschildcare.domainName],
})

const ecs = new EcsStack(app, `${stackEnv}-ecs`, {
  env,
  stackEnv,
  vpc,
  alb: albStack.alb,
  // Low-cost: t3a.micro, Free-tier: t2.micro
  instanceType: 't2.micro',
})

const landingService = new EcsServiceStack(app, `${stackEnv}-ecs-service-landing`, {
  env,
  stackEnv,
  vpc,
  repositoryName: auschildcare.ecrRepositoryName,
  domainName: auschildcare.domainName,
  cnameRecord: 'landing',
  priority: 20,
  containerPort: 7500,
  cpu: 512,
  memoryLimitMiB: 200,
})
