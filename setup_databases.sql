CREATE DATABASE IF NOT EXISTS booking_service_db;
CREATE DATABASE IF NOT EXISTS payment_service_db;
CREATE DATABASE IF NOT EXISTS identity_service_db;
CREATE DATABASE IF NOT EXISTS notification_service_db;

CREATE USER 'booking_user'@'%' IDENTIFIED BY 'booking_password';
GRANT ALL PRIVILEGES ON booking_service_db.* TO 'booking_user'@'%';

CREATE USER 'payment_user'@'%' IDENTIFIED BY 'payment_password';
GRANT ALL PRIVILEGES ON payment_service_db.* TO 'payment_user'@'%';

CREATE USER 'identity_user'@'%' IDENTIFIED BY 'identity_password';
GRANT ALL PRIVILEGES ON identity_service_db.* TO 'identity_user'@'%';

CREATE USER 'notification_user'@'%' IDENTIFIED BY 'notification_password';
GRANT ALL PRIVILEGES ON notification_service_db.* TO 'notification_user'@'%';

FLUSH PRIVILEGES;