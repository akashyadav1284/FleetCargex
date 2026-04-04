const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
const PricingConfig = require('../models/PricingConfig');

const configs = [
  { vehicleName: 'Bike',         baseFare: 30,   perKmRate: 5,   vehicleMultiplier: 1.0,  loadCharges: { small: 0, medium: 20, heavy: 40 },   nightSurcharge: 0.15, waitingChargePerMin: 1 },
  { vehicleName: 'Scooter',      baseFare: 40,   perKmRate: 6,   vehicleMultiplier: 1.0,  loadCharges: { small: 0, medium: 25, heavy: 50 },   nightSurcharge: 0.15, waitingChargePerMin: 1 },
  { vehicleName: 'Pickup',       baseFare: 80,   perKmRate: 12,  vehicleMultiplier: 1.2,  loadCharges: { small: 0, medium: 50, heavy: 100 },  nightSurcharge: 0.20, waitingChargePerMin: 2 },
  { vehicleName: 'Mini Truck',   baseFare: 120,  perKmRate: 15,  vehicleMultiplier: 1.4,  loadCharges: { small: 0, medium: 60, heavy: 150 },  nightSurcharge: 0.20, waitingChargePerMin: 2 },
  { vehicleName: 'Closed Truck', baseFare: 200,  perKmRate: 22,  vehicleMultiplier: 1.6,  loadCharges: { small: 0, medium: 80, heavy: 200 },  nightSurcharge: 0.20, waitingChargePerMin: 3 },
  { vehicleName: 'Tipper Truck', baseFare: 250,  perKmRate: 28,  vehicleMultiplier: 1.8,  loadCharges: { small: 0, medium: 100, heavy: 250 }, nightSurcharge: 0.25, waitingChargePerMin: 3 },
  { vehicleName: 'Flatbed',      baseFare: 400,  perKmRate: 35,  vehicleMultiplier: 2.0,  loadCharges: { small: 0, medium: 150, heavy: 350 }, nightSurcharge: 0.25, waitingChargePerMin: 4 },
  { vehicleName: 'Trailer',      baseFare: 800,  perKmRate: 60,  vehicleMultiplier: 2.5,  loadCharges: { small: 0, medium: 200, heavy: 500 }, nightSurcharge: 0.30, waitingChargePerMin: 5 },
];

async function seed() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);

    console.log('🗑️  Clearing old pricing configs...');
    await PricingConfig.deleteMany({});

    console.log('🌱 Seeding pricing configs...');
    for (const cfg of configs) {
      await PricingConfig.create(cfg);
      console.log(`  ✅ ${cfg.vehicleName} → base ₹${cfg.baseFare}, ₹${cfg.perKmRate}/km, ×${cfg.vehicleMultiplier}`);
    }

    console.log(`\n🎉 Seeded ${configs.length} pricing configurations!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ SEEDING FAILED:', error);
    process.exit(1);
  }
}

seed();
