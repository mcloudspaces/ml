---
title: 'Why I Finally Moved from Hive to Apache Iceberg'
date: 2026-03-01
description: 'After years of working around Hive metastore limitations, Apache Iceberg solved problems I had stopped believing were solvable.'
tags: ['apache-iceberg', 'data-platform', 'hadoop']
draft: false
---

After three years of managing a production Hive-based data lake, I finally made the migration to Apache Iceberg. Here's what changed and why it was worth the pain.

## The problem with Hive at scale

Hive served us well when the data volumes were manageable. But as our tables grew past the billion-row mark, several problems became unavoidable:

- **Schema evolution** was fragile. Adding a column was fine. Renaming one meant rewriting pipelines.
- **Small file problems** were constant. Hourly batch jobs created thousands of small Parquet files, and compaction was a manual, risky operation.
- **ACID transactions** on large tables were painfully slow.
- **Partition discovery** on table scans did full directory listings — expensive on S3.

## What Iceberg changed

Iceberg treats your table as a series of snapshots. Every write creates a new snapshot; the metadata layer tracks which files belong to which snapshot.

This gives you:

**Time travel.** Query your table as it was 7 days ago with `AS OF TIMESTAMP`. Debugging a pipeline that ingested bad data becomes straightforward.

**Schema evolution that actually works.** Column renames, type promotions — all tracked in the metadata without rewriting data.

**Partition evolution.** Change how a table is partitioned without rewriting historical data. This one alone saved us weeks of work.

**Fast scans.** Iceberg's metadata pruning means the query engine knows exactly which files to read before it touches S3.

## The migration

We used a dual-write approach. For 4 weeks, every pipeline wrote to both Hive and Iceberg tables. We validated row counts, query results, and performance on both sides before cutting over.

The hardest part wasn't technical — it was convincing stakeholders that a migration with zero user-visible changes was worth the engineering time.

It was.

## What I'd do differently

Start with Iceberg on new tables rather than migrating old ones. The migration overhead is real. If you're starting fresh, skip Hive entirely.

Also: invest in understanding the metadata layer before you need to troubleshoot it. The `$snapshots` and `$manifests` metadata tables are your friends.
