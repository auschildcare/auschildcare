import budgets = require('@aws-cdk/aws-budgets')
import cdk = require('@aws-cdk/core')

export interface BudgetStackProps extends cdk.StackProps {
  stackEnv: string
  monthlyBudgetAmount: number
  emailAddresses: string[]
}

export class BudgetStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: BudgetStackProps) {
    super(scope, id, props)

    const subscribers = props.emailAddresses.map(item => ({
      subscriptionType: 'EMAIL',
      address: item,
    }))

    new budgets.CfnBudget(this, 'totalMonthlyBudget', {
      budget: {
        budgetType: 'COST',
        timeUnit: 'MONTHLY',
        budgetLimit: {
          amount: props.monthlyBudgetAmount,
          unit: 'USD',
        },
      },
      notificationsWithSubscribers: [
        {
          notification: {
            threshold: 100,
            thresholdType: 'PERCENTAGE',
            comparisonOperator: 'GREATER_THAN',
            notificationType: 'FORECASTED',
          },
          subscribers,
        },
      ],
    })
  }
}
