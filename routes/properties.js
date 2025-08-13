const express = require('express');
const db = require('../config/database');
const { authenticateUser, authorizeOwner } = require('../middleware/auth');
const { validateProperty, handleValidationErrors } = require('../middleware/validation');
const { upload, handleUploadError, cleanupFiles } = require('../middleware/upload');

const router = express.Router();

// Get all properties (public)
router.get('/', async (req, res) => {
  try {
    const { search, location, minPrice, maxPrice, propertyType, sort = 'created_at' } = req.query;
    
    // Ensure pagination parameters are valid integers
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit) || 12));
    
    let query = `
      SELECT p.*
      FROM properties p 
      WHERE p.is_available = TRUE
    `;
    
    const queryParams = [];
    
    if (search) {
      query += ' AND (p.title LIKE ? OR p.description LIKE ? OR p.location LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (location) {
      query += ' AND p.location LIKE ?';
      queryParams.push(`%${location}%`);
    }
    
    if (minPrice) {
      query += ' AND p.price >= ?';
      queryParams.push(parseFloat(minPrice));
    }
    
    if (maxPrice) {
      query += ' AND p.price <= ?';
      queryParams.push(parseFloat(maxPrice));
    }
    
    if (propertyType) {
      query += ' AND p.property_type = ?';
      queryParams.push(propertyType);
    }
    
    // Add sorting
    switch (sort) {
      case 'price_asc':
        query += ' ORDER BY p.price ASC';
        break;
      case 'price_desc':
        query += ' ORDER BY p.price DESC';
        break;
      case 'area_desc':
        query += ' ORDER BY p.area_sqft DESC';
        break;
      default:
        query += ' ORDER BY p.created_at DESC';
    }
    
    // Add pagination
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);
    
    console.log('Query:', query);
    console.log('Params:', queryParams);
    
    const [properties] = await db.execute(query, queryParams);
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM properties p 
      WHERE p.is_available = TRUE
    `;
    const countParams = [];
    
    if (search) {
      countQuery += ' AND (p.title LIKE ? OR p.description LIKE ? OR p.location LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (location) {
      countQuery += ' AND p.location LIKE ?';
      countParams.push(`%${location}%`);
    }
    if (minPrice) {
      countQuery += ' AND p.price >= ?';
      countParams.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      countQuery += ' AND p.price <= ?';
      countParams.push(parseFloat(maxPrice));
    }
    if (propertyType) {
      countQuery += ' AND p.property_type = ?';
      countParams.push(propertyType);
    }
    
    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;
    
    res.json({
      properties,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
    
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({ message: 'Error loading properties' });
  }
});

// Get single property details
router.get('/:id', async (req, res) => {
  try {
    const propertyId = req.params.id;
    
    // Get property details
    const [properties] = await db.execute(`
      SELECT p.*, u.username as owner_name, u.full_name as owner_full_name, u.phone as owner_phone, u.email as owner_email,
             (SELECT image_url FROM property_images WHERE property_id = p.id AND is_primary = TRUE LIMIT 1) as image_url
      FROM properties p 
      JOIN users u ON p.owner_id = u.id 
      WHERE p.id = ?
    `, [propertyId]);
    
    if (properties.length === 0) {
      return res.status(404).json({ message: 'Property not found' });
    }
    
    const property = properties[0];
    
    // Get property images
    const [images] = await db.execute(
      'SELECT * FROM property_images WHERE property_id = ? ORDER BY is_primary DESC, id ASC',
      [propertyId]
    );
    
    // Record property view (if user is logged in)
    if (req.session.user) {
      await db.execute(
        'INSERT INTO property_views (property_id, user_id) VALUES (?, ?)',
        [propertyId, req.session.user.id]
      );
    }
    
    const owner = {
      id: property.owner_id,
      username: property.owner_name,
      full_name: property.owner_full_name,
      phone: property.owner_phone,
      email: property.owner_email
    };
    
    res.json({
      property,
      owner,
      images
    });
    
  } catch (error) {
    console.error('Error fetching property details:', error);
    res.status(500).json({ message: 'Error loading property details' });
  }
});

// Owner's properties dashboard
router.get('/my-properties', authenticateUser, async (req, res) => {
  try {
    const [properties] = await db.execute(`
      SELECT p.*, 
             (SELECT image_url FROM property_images WHERE property_id = p.id AND is_primary = TRUE LIMIT 1) as image_url,
             (SELECT COUNT(*) FROM property_views WHERE property_id = p.id) as view_count
      FROM properties p 
      WHERE p.owner_id = ? 
      ORDER BY p.created_at DESC
    `, [req.session.user.id]);
    
    res.json({
      properties
    });
    
  } catch (error) {
    console.error('Error fetching owner properties:', error);
    res.status(500).json({ message: 'Error loading your properties' });
  }
});

// Add property process
router.post('/',
  authenticateUser,
  upload.array('images', 10),
  handleUploadError,
  validateProperty,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { title, description, location, price, property_type, bedrooms, bathrooms, area_sqft, is_available = true } = req.body;
      
      // Insert property
      const [result] = await db.execute(`
        INSERT INTO properties (owner_id, title, description, location, price, property_type, bedrooms, bathrooms, area_sqft, is_available) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        req.session.user.id,
        title,
        description,
        location,
        parseFloat(price),
        property_type,
        bedrooms ? parseInt(bedrooms) : null,
        bathrooms ? parseInt(bathrooms) : null,
        area_sqft ? parseInt(area_sqft) : null,
        is_available
      ]);
      
      const propertyId = result.insertId;
      
      // Handle image uploads
      if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          const imageUrl = `/uploads/properties/${file.filename}`;
          const isPrimary = i === 0; // First image is primary
          
          await db.execute(
            'INSERT INTO property_images (property_id, image_url, is_primary) VALUES (?, ?, ?)',
            [propertyId, imageUrl, isPrimary]
          );
        }
      }
      
      res.status(201).json({ 
        message: 'Property added successfully!',
        propertyId 
      });
      
    } catch (error) {
      console.error('Error adding property:', error);
      
      // Clean up uploaded files on error
      if (req.files) {
        cleanupFiles(req.files);
      }
      
      res.status(500).json({ message: 'Error adding property. Please try again.' });
    }
  }
);

// Update property
router.put('/:id',
  authenticateUser,
  upload.array('images', 10),
  handleUploadError,
  validateProperty,
  handleValidationErrors,
  async (req, res) => {
    try {
      const propertyId = req.params.id;
      const { title, description, location, price, property_type, bedrooms, bathrooms, area_sqft, is_available = true } = req.body;
      
      // Verify ownership
      const [existing] = await db.execute(
        'SELECT id FROM properties WHERE id = ? AND owner_id = ?',
        [propertyId, req.session.user.id]
      );
      
      if (existing.length === 0) {
        return res.status(404).json({ message: 'Property not found or access denied' });
      }
      
      // Update property
      await db.execute(`
        UPDATE properties 
        SET title = ?, description = ?, location = ?, price = ?, property_type = ?, 
            bedrooms = ?, bathrooms = ?, area_sqft = ?, is_available = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        title,
        description,
        location,
        parseFloat(price),
        property_type,
        bedrooms ? parseInt(bedrooms) : null,
        bathrooms ? parseInt(bathrooms) : null,
        area_sqft ? parseInt(area_sqft) : null,
        is_available,
        propertyId
      ]);
        propertyType,
        bedrooms ? parseInt(bedrooms) : null,
        bathrooms ? parseInt(bathrooms) : null,
        areaSqft ? parseInt(areaSqft) : null,
        propertyId
      
      // Handle new image uploads
      if (req.files && req.files.length > 0) {
        // Check if this is the first image for this property
        const [existingImages] = await db.execute(
          'SELECT COUNT(*) as count FROM property_images WHERE property_id = ?',
          [propertyId]
        );
        
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          const imageUrl = `/uploads/properties/${file.filename}`;
          const isPrimary = existingImages[0].count === 0 && i === 0;
          
          await db.execute(
            'INSERT INTO property_images (property_id, image_url, is_primary) VALUES (?, ?, ?)',
            [propertyId, imageUrl, isPrimary]
          );
        }
      }
      
      res.json({ message: 'Property updated successfully!' });
      
    } catch (error) {
      console.error('Error updating property:', error);
      
      if (req.files) {
        cleanupFiles(req.files);
      }
      
      res.status(500).json({ message: 'Error updating property. Please try again.' });
    }
  }
);

// Delete property
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const propertyId = req.params.id;
    
    // Verify ownership
    const [existing] = await db.execute(
      'SELECT id FROM properties WHERE id = ? AND owner_id = ?',
      [propertyId, req.session.user.id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Property not found or access denied' });
    }
    
    // Delete property (cascade will handle related records)
    await db.execute('DELETE FROM properties WHERE id = ?', [propertyId]);
    
    res.json({ message: 'Property deleted successfully!' });
    
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({ message: 'Error deleting property' });
  }
});
module.exports = router;
