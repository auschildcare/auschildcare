#!/usr/bin/env node
import cdk = require('@aws-cdk/core')
import { BudgetStack } from '../lib/budget-stack'
import { S3Stack } from '../lib/s3-stack'

const env = {
  account: '874536534479', // auschildcare
  region: 'ap-southeast-2', // Sydney
}

const stackEnv = 'prod'

const auschildcare = {
  domainName: 'auschildcare.com',
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
