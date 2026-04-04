const { calculateFare } = require('../services/pricingService');

describe('Pricing Engine', () => {
  test('calculates correct base fare for Mini Truck', () => {
    const fare = calculateFare('Mini Truck', 10, 20, false, 1.0, {});
    // base: 150, dist charge: 10 * 15 = 150, time: 20 * 2 = 40
    // subtotal = 340
    // tax = 18% of 340 = 61.2
    // total = 401.2 -> ceil -> 402
    expect(fare.base).toBe(150);
    expect(fare.distance).toBe(150);
    expect(fare.time).toBe(40);
    expect(fare.total).toBe(402);
  });
  
  test('calculates correct fare with labor and insurance', () => {
    const fare = calculateFare('Mini Truck', 10, 20, false, 1.0, { laborRequired: true, insuranceRequested: true });
    // base: 150, dist: 150, time: 40, labor: 300, ins: 100
    // subtotal = 740
    // tax = 133.2
    // total = 874
    expect(fare.total).toBe(874);
  });
});
