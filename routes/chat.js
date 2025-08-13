const express = require('express');
const db = require('../config/database');
const { authenticateUser } = require('../middleware/auth');
const { validateMessage, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Get user's conversations
router.get('/conversations', authenticateUser, async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    const [conversations] = await db.execute(`
      SELECT c.*, 
             p.title as property_title,
             p.price as property_price,
             (SELECT image_url FROM property_images WHERE property_id = p.id AND is_primary = TRUE LIMIT 1) as property_image,
             CASE 
               WHEN c.buyer_id = ? THEN owner.full_name 
               ELSE buyer.full_name 
             END as other_party_name,
             CASE 
               WHEN c.buyer_id = ? THEN owner.username 
               ELSE buyer.username 
             END as other_party_username,
             (SELECT message FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
             (SELECT created_at FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
             (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND is_read = FALSE) as unread_count
      FROM conversations c
      JOIN properties p ON c.property_id = p.id
      JOIN users buyer ON c.buyer_id = buyer.id
      JOIN users owner ON c.owner_id = owner.id
      WHERE c.buyer_id = ? OR c.owner_id = ?
      ORDER BY last_message_time DESC
    `, [userId, userId, userId, userId, userId]);
    
    res.render('chat/conversations', {
      title: 'My Conversations',
      conversations
    });
    
  } catch (error) {
    console.error('Error fetching conversations:', error);
    req.flash('error', 'Error loading conversations');
    res.redirect('/');
  }
});

// Start or continue conversation about a property
router.get('/property/:propertyId', authenticateUser, async (req, res) => {
  try {
    const propertyId = req.params.propertyId;
    const userId = req.session.user.id;
    
    // Get property details
    const [properties] = await db.execute(`
      SELECT p.*, u.full_name as owner_name, u.username as owner_username
      FROM properties p 
      JOIN users u ON p.owner_id = u.id 
      WHERE p.id = ?
    `, [propertyId]);
    
    if (properties.length === 0) {
      req.flash('error', 'Property not found');
      return res.redirect('/properties');
    }
    
    const property = properties[0];
    
    // Prevent owner from chatting with themselves
    if (property.owner_id === userId) {
      req.flash('error', 'You cannot chat about your own property');
      return res.redirect(`/properties/${propertyId}`);
    }
    
    // Find or create conversation
    let [conversations] = await db.execute(
      'SELECT * FROM conversations WHERE property_id = ? AND buyer_id = ?',
      [propertyId, userId]
    );
    
    let conversationId;
    if (conversations.length === 0) {
      // Create new conversation
      const [result] = await db.execute(
        'INSERT INTO conversations (property_id, buyer_id, owner_id) VALUES (?, ?, ?)',
        [propertyId, userId, property.owner_id]
      );
      conversationId = result.insertId;
    } else {
      conversationId = conversations[0].id;
    }
    
    res.redirect(`/chat/${conversationId}`);
    
  } catch (error) {
    console.error('Error starting conversation:', error);
    req.flash('error', 'Error starting conversation');
    res.redirect(`/properties/${req.params.propertyId}`);
  }
});

// Get specific conversation
router.get('/:conversationId', authenticateUser, async (req, res) => {
  try {
    const conversationId = req.params.conversationId;
    const userId = req.session.user.id;
    
    // Verify user is part of this conversation
    const [conversations] = await db.execute(`
      SELECT c.*, 
             p.title as property_title,
             p.price as property_price,
             (SELECT image_url FROM property_images WHERE property_id = p.id AND is_primary = TRUE LIMIT 1) as property_image,
             buyer.full_name as buyer_name,
             buyer.username as buyer_username,
             owner.full_name as owner_name,
             owner.username as owner_username
      FROM conversations c
      JOIN properties p ON c.property_id = p.id
      JOIN users buyer ON c.buyer_id = buyer.id
      JOIN users owner ON c.owner_id = owner.id
      WHERE c.id = ? AND (c.buyer_id = ? OR c.owner_id = ?)
    `, [conversationId, userId, userId]);
    
    if (conversations.length === 0) {
      req.flash('error', 'Conversation not found or access denied');
      return res.redirect('/chat/conversations');
    }
    
    const conversation = conversations[0];
    
    // Get messages
    const [messages] = await db.execute(`
      SELECT m.*, u.full_name as sender_name, u.username as sender_username
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at ASC
    `, [conversationId]);
    
    // Mark messages as read
    await db.execute(
      'UPDATE messages SET is_read = TRUE WHERE conversation_id = ? AND sender_id != ?',
      [conversationId, userId]
    );
    
    res.render('chat/conversation', {
      title: `Chat - ${conversation.property_title}`,
      conversation,
      messages
    });
    
  } catch (error) {
    console.error('Error loading conversation:', error);
    req.flash('error', 'Error loading conversation');
    res.redirect('/chat/conversations');
  }
});

// Send message (API endpoint)
router.post('/:conversationId/messages',
  authenticateUser,
  validateMessage,
  handleValidationErrors,
  async (req, res) => {
    try {
      const conversationId = req.params.conversationId;
      const userId = req.session.user.id;
      const { message } = req.body;
      
      // Verify user is part of this conversation
      const [conversations] = await db.execute(
        'SELECT * FROM conversations WHERE id = ? AND (buyer_id = ? OR owner_id = ?)',
        [conversationId, userId, userId]
      );
      
      if (conversations.length === 0) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Insert message
      const [result] = await db.execute(
        'INSERT INTO messages (conversation_id, sender_id, message) VALUES (?, ?, ?)',
        [conversationId, userId, message]
      );
      
      // Update conversation timestamp
      await db.execute(
        'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [conversationId]
      );
      
      // Get the inserted message with sender info
      const [newMessages] = await db.execute(`
        SELECT m.*, u.full_name as sender_name, u.username as sender_username
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.id = ?
      `, [result.insertId]);
      
      const newMessage = newMessages[0];
      
      // Emit to Socket.IO room
      const io = req.app.get('io');
      if (io) {
        io.to(`conversation_${conversationId}`).emit('new_message', {
          id: newMessage.id,
          message: newMessage.message,
          sender_id: newMessage.sender_id,
          sender_name: newMessage.sender_name,
          sender_username: newMessage.sender_username,
          created_at: newMessage.created_at
        });
      }
      
      res.json({ success: true, message: newMessage });
      
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Error sending message' });
    }
  }
);

module.exports = router;
