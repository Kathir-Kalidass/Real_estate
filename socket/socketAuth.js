const session = require('express-session');
const db = require('../config/database');

function setupSocketAuth(io) {
  // Socket.IO authentication middleware
  io.use((socket, next) => {
    const sessionMiddleware = session({
      secret: process.env.SESSION_SECRET || 'your-secret-key',
      resave: false,
      saveUninitialized: false
    });

    sessionMiddleware(socket.request, {}, next);
  });

  io.on('connection', (socket) => {
    const user = socket.request.session?.user;
    
    if (!user) {
      socket.disconnect();
      return;
    }

    console.log(`User ${user.username} connected to chat`);

    // Join user to their personal room
    socket.join(`user_${user.id}`);

    // Handle joining conversation rooms
    socket.on('join_conversation', async (conversationId) => {
      try {
        // Verify user is part of this conversation
        const [conversations] = await db.execute(
          'SELECT * FROM conversations WHERE id = ? AND (buyer_id = ? OR owner_id = ?)',
          [conversationId, user.id, user.id]
        );

        if (conversations.length > 0) {
          socket.join(`conversation_${conversationId}`);
          console.log(`User ${user.username} joined conversation ${conversationId}`);
        }
      } catch (error) {
        console.error('Error joining conversation:', error);
      }
    });

    // Handle leaving conversation rooms
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(`User ${user.username} left conversation ${conversationId}`);
    });

    // Handle typing indicators
    socket.on('typing_start', (conversationId) => {
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        userId: user.id,
        username: user.username,
        isTyping: true
      });
    });

    socket.on('typing_stop', (conversationId) => {
      socket.to(`conversation_${conversationId}`).emit('user_typing', {
        userId: user.id,
        username: user.username,
        isTyping: false
      });
    });

    // Handle message read receipts
    socket.on('message_read', async (messageId) => {
      try {
        await db.execute(
          'UPDATE messages SET is_read = TRUE WHERE id = ? AND sender_id != ?',
          [messageId, user.id]
        );

        // Notify sender that message was read
        const [messages] = await db.execute(
          'SELECT sender_id, conversation_id FROM messages WHERE id = ?',
          [messageId]
        );

        if (messages.length > 0) {
          const message = messages[0];
          socket.to(`user_${message.sender_id}`).emit('message_read_receipt', {
            messageId: messageId,
            readBy: user.id
          });
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User ${user.username} disconnected from chat`);
    });
  });
}

module.exports = { setupSocketAuth };
