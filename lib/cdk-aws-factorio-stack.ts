import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as efs from "aws-cdk-lib/aws-efs";
import { Construct } from "constructs";

export class CdkAwsFactorioStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const FACTORIO_IMAGE_TAG = "stable"

    // The code that defines your stack goes here
    const vpc = new ec2.Vpc(this, "Factorio-VPC", {
      maxAzs: 1,
      natGateways: 0,
    });

    const fileSystem = new efs.FileSystem(this, "FileSystem", {
      vpc,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const cluster = new ecs.Cluster(this, "EcsCluster", { vpc });

    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      "TaskDefinition",
      {
        cpu: 512,
        memoryLimitMiB: 1024,
      }
    );

    const VOLUME_NAME = "FactorioEfsVolume";

    const cfnTaskDef = taskDefinition.node.defaultChild as ecs.CfnTaskDefinition
    cfnTaskDef.addPropertyOverride("Volumes", [
      {
        EFSVolumeConfiguration: {
          FilesystemId: fileSystem.fileSystemId,
        },
        Name: VOLUME_NAME,
      },
    ]);

    const container = taskDefinition.addContainer("Container", {
      image: ecs.ContainerImage.fromRegistry(
        `factoriotools/factorio:${FACTORIO_IMAGE_TAG}`
      ),
      memoryReservationMiB: 1024,
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: "Factorio", logRetention: 7 }),
    });
    container.addPortMappings(
      // Game port
      { containerPort: 34197, hostPort: 34197, protocol: ecs.Protocol.UDP },
      // Rcon port
      { containerPort: 27015, hostPort: 27015, protocol: ecs.Protocol.TCP }
    );
    container.addMountPoints({
      containerPath: "/factorio",
      sourceVolume: VOLUME_NAME,
      readOnly: false,
    });

    const service = new ecs.FargateService(this, "Service", {
      cluster,
      taskDefinition,
      desiredCount: 1,
      maxHealthyPercent: 100,
      minHealthyPercent: 0,
      assignPublicIp: true,
      platformVersion: ecs.FargatePlatformVersion.LATEST,
    });

    service.connections.allowFromAnyIpv4(ec2.Port.udp(34197));
    service.connections.allowFromAnyIpv4(ec2.Port.tcp(27015));
    fileSystem.connections.allowFrom(service, ec2.Port.tcp(2049));
  }
}
