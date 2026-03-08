---
title: 'Running Kafka on Kubernetes: What No One Tells You'
date: 2026-02-10
description: 'Kafka was designed for bare metal. Kubernetes was designed for stateless workloads. Running one on the other requires careful thinking.'
tags: ['kafka', 'kubernetes', 'data-platform', 'operations']
draft: false
---

Running Apache Kafka on Kubernetes is not as straightforward as the Helm chart makes it look. Here are the operational realities after 18 months in production.

## The impedance mismatch

Kafka is fundamentally a stateful, network-sensitive, disk-bound system. Kubernetes was designed with stateless workloads in mind. The primitives that make Kubernetes elegant for web services — pod restarts, rolling updates, ephemeral storage — are exactly the things that make Kafka unhappy.

This doesn't mean you shouldn't do it. It means you need to understand what you're trading.

## Storage: get this right first

The most important decision is persistent storage. You have two realistic options:

**Local NVMe via LocalPersistentVolumes.** Kafka loves local storage — no network overhead, maximum throughput. The tradeoff: a node failure means that broker's data is unavailable until the node returns or you've rebuilt the replica. Not for the faint-hearted.

**Network storage (EBS on AWS, Persistent Disk on GCP).** Easier to operate, survives node failures. The tradeoff: increased write latency, which affects producer throughput under load.

For most teams starting out: use network storage and accept the latency. Optimise later.

## Broker identity matters

Kafka brokers have identity. Broker 0, Broker 1, Broker 2 — the cluster knows them by ID. Kubernetes StatefulSets give you stable pod identity and stable DNS names, which is exactly what you need. Never use Deployments for Kafka brokers.

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: kafka
spec:
  serviceName: kafka-headless
  replicas: 3
  # ...
```

The headless service (`clusterIP: None`) is essential — it allows direct pod-to-pod communication without going through a load balancer.

## JVM tuning in containers

Kafka runs on the JVM. By default, the JVM looks at total system memory to size its heap — not the container's memory limit. This will cause OOM kills.

Set explicit heap sizes:

```bash
KAFKA_HEAP_OPTS="-Xms4g -Xmx4g"
```

And add `-XX:+UseContainerSupport` to your JVM flags if you're on JDK 11+.

## What I'd recommend

For production Kafka on Kubernetes, use the **Strimzi operator**. It handles the operational complexity — rolling updates that respect partition leadership, rack-aware placement, TLS certificate rotation. Rolling this yourself is a rite of passage I'd recommend skipping.

The operator doesn't remove the need to understand Kafka — you still need to tune replication factors, retention, and partition counts. But it handles the Kubernetes integration gracefully.
