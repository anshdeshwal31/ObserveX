import "./index.ts"; // Starts the Express API
import "../../apps/consumer/websiteCheckConsumer.ts"; // Starts the Check Consumer
import "../../apps/consumer/bulkUploadConsumer.ts"; // Starts the AIOps/Incident Consumer
import "../../apps/producer/websiteListProducer.ts"; // Starts the Cron Producer

console.log("🚀 All PingNova microservices started on a single process!");
