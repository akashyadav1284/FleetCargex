const VehicleType = require('../models/VehicleType');
const Category = require('../models/Category');
const apiCache = require('../utils/cache');

// GET /api/universal/categories
exports.getCargoCategories = async (req, res) => {
  try {
    const cacheKey = 'universal_categories';
    const cachedData = apiCache.get(cacheKey);
    // Return instantly from RAM if cached
    if (cachedData) return res.status(200).json(cachedData);

    const categories = await Category.find({}, 'name subcategories').lean();
    
    // Front-end expects array of strings directly in `data`
    const categoryNames = categories.map(c => c.name);
    
    const responsePayload = { success: true, data: categoryNames, detailedCategories: categories };
    
    // Cache for 1 hr
    apiCache.set(cacheKey, responsePayload);

    // Pass both formats: flat (for existing UI) and structured (for future UI)
    res.status(200).json(responsePayload);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// GET /api/universal/cargo/:category
exports.getCargoByCategory = async (req, res) => {
  try {
    const categoryName = req.params.category;
    const cacheKey = `cargo_by_category_${categoryName}`;
    const cachedData = apiCache.get(cacheKey);
    
    if (cachedData) return res.status(200).json(cachedData);

    // Lean speeds up data mapping
    const catDoc = await Category.findOne({ name: categoryName }).lean();
    
    if (!catDoc) return res.status(404).json({ success: false, error: 'Category not found' });

    // Format for existing frontend fallback
    const cargoTypes = catDoc.subcategories.map(sub => {
      return {
        _id: `${categoryName}_${sub.name}`, // pseudo ID for existing frontend
        name: sub.name,
        description: sub.description || '',
        category: categoryName,
        realSubcategoryId: sub._id // new relational ID
      };
    });

    const responsePayload = { success: true, data: cargoTypes, rawSubcategories: catDoc.subcategories };
    apiCache.set(cacheKey, responsePayload);

    res.status(200).json(responsePayload);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// POST /api/universal/recommend
exports.getRecommendations = async (req, res) => {
  try {
    const { cargoTypeId, distanceKm, loadType } = req.body;
    
    if (!cargoTypeId || !cargoTypeId.includes('_')) {
       return res.status(400).json({ success: false, error: 'Invalid cargo ID format' });
    }

    const parts = cargoTypeId.split('_');
    const reqCategory = parts[0];
    const reqSubCategory = parts.slice(1).join('_');
    
    const catDoc = await Category.findOne({ name: reqCategory }).lean();
    if (!catDoc) return res.status(404).json({ success: false, error: 'Parent Category not found.' });

    const subDoc = catDoc.subcategories.find(s => s.name === reqSubCategory);
    if (!subDoc) return res.status(404).json({ success: false, error: 'Subcategory not found.' });

    const vehicles = await VehicleType.find({ 
      categoryId: catDoc._id, 
      subcategoryId: subDoc._id, 
      isActive: true 
    }).lean();
    
    if (vehicles.length === 0) {
      return res.status(404).json({ success: false, error: 'No vehicles mapped for this selection.' });
    }
    
    const distance = distanceKm || 15;
    const { calculateFareBreakdown } = require('./fareController');
    
    // Calculate fare breakdown for each vehicle via the pricing engine
    const recommendations = await Promise.all(vehicles.map(async (vehicle) => {
      try {
        const breakdown = await calculateFareBreakdown({
          vehicleType: vehicle.name,
          distanceKm: distance,
          loadType: loadType || 'small',
          timeOfDay: new Date().getHours()
        });

        return {
          vehicleTypeId: vehicle._id,
          name: vehicle.name,
          category: catDoc.name,
          capacity: vehicle.capacityKg,
          estimatedPrice: breakdown.totalFare,
          breakdown: {
            baseFare: breakdown.baseFare,
            distanceCost: breakdown.distanceCost,
            loadCost: breakdown.loadCost,
            vehicleMultiplier: breakdown.vehicleMultiplier,
            surgeMultiplier: breakdown.surgeMultiplier,
            nightSurcharge: breakdown.nightSurcharge,
            totalFare: breakdown.totalFare
          }
        };
      } catch {
        // Fallback if no PricingConfig exists for this vehicle
        const estimatedPrice = vehicle.baseFare + (distance * vehicle.perKmRate);
        return {
          vehicleTypeId: vehicle._id,
          name: vehicle.name,
          category: catDoc.name,
          capacity: vehicle.capacityKg,
          estimatedPrice: Math.round(estimatedPrice),
          breakdown: null
        };
      }
    }));
    
    // Sort by price (cheapest first)
    recommendations.sort((a, b) => a.estimatedPrice - b.estimatedPrice);
    
    res.status(200).json({
      success: true,
      data: recommendations
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
