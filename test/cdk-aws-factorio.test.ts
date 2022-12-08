import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import * as CdkAwsFactorio from "../lib/cdk-aws-factorio-stack";

test("VPC Created", () => {
  const app = new cdk.App();
  const stack = new CdkAwsFactorio.CdkAwsFactorioStack(app, "MyTestStack");
  const template = Template.fromStack(stack);
  template.hasResource("AWS::EC2::VPC", {});
});
