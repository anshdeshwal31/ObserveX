import "./index.ts"; // Starts the Express API
import "../consumer/websiteCheckConsumer.ts"; // Starts the Check Consumer
import "../consumer/bulkUploadConsumer.ts"; // Starts the AIOps/Incident Consumer
import "../producer/websiteListProducer.ts"; // Starts the Cron Producer

console.log("🚀 All PingNova microservices started on a single process!");
