#!/bin/bash

# Wait for Kafka to be ready
echo "Waiting for Kafka to be ready..."
sleep 10

# Create booking topics
kafka-topics --create --if-not-exists \
  --bootstrap-server kafka:9092 \
  --topic booking.reserved.v1 \
  --partitions 3 \
  --replication-factor 1

kafka-topics --create --if-not-exists \
  --bootstrap-server kafka:9092 \
  --topic booking.confirmed.v1 \
  --partitions 3 \
  --replication-factor 1

kafka-topics --create --if-not-exists \
  --bootstrap-server kafka:9092 \
  --topic booking.cancelled.v1 \
  --partitions 3 \
  --replication-factor 1

# Create payment topics
kafka-topics --create --if-not-exists \
  --bootstrap-server kafka:9092 \
  --topic payment.initiated.v1 \
  --partitions 3 \
  --replication-factor 1

kafka-topics --create --if-not-exists \
  --bootstrap-server kafka:9092 \
  --topic payment.captured.v1 \
  --partitions 3 \
  --replication-factor 1

kafka-topics --create --if-not-exists \
  --bootstrap-server kafka:9092 \
  --topic payment.failed.v1 \
  --partitions 3 \
  --replication-factor 1

kafka-topics --create --if-not-exists \
  --bootstrap-server kafka:9092 \
  --topic payment.authorized.v1 \
  --partitions 3 \
  --replication-factor 1

# Create identity/profile topics
kafka-topics --create --if-not-exists \
  --bootstrap-server kafka:9092 \
  --topic member.created.v1 \
  --partitions 3 \
  --replication-factor 1

kafka-topics --create --if-not-exists \
  --bootstrap-server kafka:9092 \
  --topic profile.updated.v1 \
  --partitions 3 \
  --replication-factor 1

# Create dead-letter topic for failed messages
kafka-topics --create --if-not-exists \
  --bootstrap-server kafka:9092 \
  --topic notifications.dlq \
  --partitions 3 \
  --replication-factor 1

echo "Kafka topics created successfully"
