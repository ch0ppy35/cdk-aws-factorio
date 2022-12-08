import * as cdk from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import * as CdkAwsFactorio from "../lib/cdk-aws-factorio-stack";

const app = new cdk.App();
const stack = new CdkAwsFactorio.CdkAwsFactorioStack(app, "MyTestStack");
const template = Template.fromStack(stack);

test("VPC Created", () => {
  template.hasResourceProperties(
    "AWS::EC2::VPC",
    Match.objectEquals({
      CidrBlock: "10.10.0.0/16",
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
      InstanceTenancy: "default",
      Tags: [
        {
          Key: "Name",
          Value: "MyTestStack/Factorio-VPC",
        },
      ],
    })
  );
});

test("EFS Filesystem Created", () => {
  template.hasResourceProperties(
    "AWS::EFS::FileSystem",
    Match.objectEquals({
      Encrypted: true,
      FileSystemTags: [
        {
          Key: "Name",
          Value: "MyTestStack/FileSystem",
        },
      ],
    })
  );
});

test("ECS Cluster Created", () => {
  template.hasResource("AWS::ECS::Cluster", {})
})