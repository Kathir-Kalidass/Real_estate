// Real Estate App JavaScript

// Initialize Socket.IO connection
let socket = null;
let currentConversationId = null;
let typingTimeout = null;

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeSocket();
    initializeEventListeners();
    initializeImageCarousel();
    initializeFormValidation();
});

// Socket.IO initialization
function initializeSocket() {
    if (typeof io !== 'undefined') {
        socket = io();
        
        socket.on('connect', function() {
            console.log('Connected to server');
        });
        
        socket.on('disconnect', function() {
            console.log('Disconnected from server');
        });
        
        // Listen for new messages
        socket.on('new_message', function(message) {
            if (currentConversationId) {
                appendMessage(message);
                scrollToBottom();
            }
            updateUnreadCount();
        });
        
        // Listen for typing indicators
        socket.on('user_typing', function(data) {
            if (currentConversationId) {
                showTypingIndicator(data);
            }
        });
        
        // Listen for read receipts
        socket.on('message_read_receipt', function(data) {
            markMessageAsRead(data.messageId);
        });
    }
}

// Event listeners
function initializeEventListeners() {
    // Search form enhancements
    const searchInputs = document.querySelectorAll('input[name="search"], input[name="location"]');
    searchInputs.forEach(input => {
        input.addEventListener('input', debounce(function() {
            // Could implement real-time search suggestions here
        }, 300));
    });
    
    // Price range validation
    const minPriceInput = document.querySelector('input[name="minPrice"]');
    const maxPriceInput = document.querySelector('input[name="maxPrice"]');
    
    if (minPriceInput && maxPriceInput) {
        minPriceInput.addEventListener('change', validatePriceRange);
        maxPriceInput.addEventListener('change', validatePriceRange);
    }
    
    // Property form enhancements
    const propertyForm = document.querySelector('#property-form');
    if (propertyForm) {
        propertyForm.addEventListener('submit', handlePropertySubmit);
    }
    
    // Chat functionality
    const messageForm = document.querySelector('#message-form');
    if (messageForm) {
        messageForm.addEventListener('submit', sendMessage);
        
        const messageInput = document.querySelector('#message-input');
        if (messageInput) {
            messageInput.addEventListener('keypress', handleTyping);
            messageInput.addEventListener('keyup', stopTyping);
        }
    }
    
    // Auto-dismiss alerts
    setTimeout(function() {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        });
    }, 5000);
}

// Image carousel for property details
function initializeImageCarousel() {
    const thumbnails = document.querySelectorAll('.property-image-thumbnails img');
    const mainImage = document.querySelector('#main-property-image');
    
    thumbnails.forEach(thumbnail => {
        thumbnail.addEventListener('click', function() {
            // Remove active class from all thumbnails
            thumbnails.forEach(thumb => thumb.classList.remove('active'));
            
            // Add active class to clicked thumbnail
            this.classList.add('active');
            
            // Update main image
            if (mainImage) {
                mainImage.src = this.src;
                mainImage.alt = this.alt;
            }
        });
    });
}

// Form validation
function initializeFormValidation() {
    const forms = document.querySelectorAll('.needs-validation');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        });
    });
}

// Chat functions
function joinConversation(conversationId) {
    currentConversationId = conversationId;
    if (socket) {
        socket.emit('join_conversation', conversationId);
    }
    scrollToBottom();
}

function leaveConversation() {
    if (currentConversationId && socket) {
        socket.emit('leave_conversation', currentConversationId);
        currentConversationId = null;
    }
}

function sendMessage(event) {
    event.preventDefault();
    
    const messageInput = document.querySelector('#message-input');
    const message = messageInput.value.trim();
    
    if (!message || !currentConversationId) return;
    
    // Show loading state
    const submitBtn = document.querySelector('#send-btn');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status"></span>';
    submitBtn.disabled = true;
    
    fetch(`/chat/${currentConversationId}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            messageInput.value = '';
            stopTyping();
        } else {
            showAlert('Error sending message', 'danger');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showAlert('Error sending message', 'danger');
    })
    .finally(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        messageInput.focus();
    });
}

function appendMessage(message) {
    const chatContainer = document.querySelector('#chat-messages');
    if (!chatContainer) return;
    
    const messageElement = createMessageElement(message);
    chatContainer.appendChild(messageElement);
}

function createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.sender_id === getCurrentUserId() ? 'own' : ''}`;
    
    messageDiv.innerHTML = `
        <div class="message-bubble">
            <div class="message-text">${escapeHtml(message.message)}</div>
            <div class="message-info">
                ${message.sender_name} • ${formatMessageTime(message.created_at)}
            </div>
        </div>
    `;
    
    return messageDiv;
}

function handleTyping(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage(event);
        return;
    }
    
    if (socket && currentConversationId) {
        socket.emit('typing_start', currentConversationId);
        
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            socket.emit('typing_stop', currentConversationId);
        }, 1000);
    }
}

function stopTyping() {
    if (socket && currentConversationId) {
        socket.emit('typing_stop', currentConversationId);
    }
    clearTimeout(typingTimeout);
}

function showTypingIndicator(data) {
    if (data.userId === getCurrentUserId()) return;
    
    const chatContainer = document.querySelector('#chat-messages');
    const existingIndicator = document.querySelector('.typing-indicator');
    
    if (data.isTyping) {
        if (!existingIndicator) {
            const typingDiv = document.createElement('div');
            typingDiv.className = 'typing-indicator';
            typingDiv.innerHTML = `
                <span>${data.username} is typing</span>
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            `;
            chatContainer.appendChild(typingDiv);
            scrollToBottom();
        }
    } else {
        if (existingIndicator) {
            existingIndicator.remove();
        }
    }
}

function scrollToBottom() {
    const chatContainer = document.querySelector('#chat-messages');
    if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function validatePriceRange() {
    const minPrice = parseFloat(document.querySelector('input[name="minPrice"]').value) || 0;
    const maxPrice = parseFloat(document.querySelector('input[name="maxPrice"]').value) || Infinity;
    
    if (minPrice > maxPrice) {
        showAlert('Minimum price cannot be greater than maximum price', 'warning');
    }
}

function handlePropertySubmit(event) {
    // Additional property form validation could go here
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput && fileInput.files.length > 10) {
        event.preventDefault();
        showAlert('Maximum 10 images allowed', 'danger');
    }
}

function showAlert(message, type = 'info') {
    const alertContainer = document.querySelector('.container');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertContainer.insertBefore(alertDiv, alertContainer.firstChild);
    
    setTimeout(() => {
        const bsAlert = new bootstrap.Alert(alertDiv);
        bsAlert.close();
    }, 5000);
}

function formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getCurrentUserId() {
    // This would need to be set from the server side
    return window.currentUserId || null;
}

function updateUnreadCount() {
    // Update unread message count in navbar
    fetch('/chat/unread-count')
        .then(response => response.json())
        .then(data => {
            const badge = document.querySelector('#unread-count');
            if (badge) {
                if (data.count > 0) {
                    badge.textContent = data.count;
                    badge.style.display = 'inline';
                } else {
                    badge.style.display = 'none';
                }
            }
        })
        .catch(error => console.error('Error updating unread count:', error));
}

function markMessageAsRead(messageId) {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
        messageElement.classList.add('read');
    }
}

// Auto-refresh conversation list
function startConversationListRefresh() {
    setInterval(() => {
        if (window.location.pathname === '/chat/conversations') {
            updateUnreadCount();
        }
    }, 30000); // Refresh every 30 seconds
}

// Initialize conversation list refresh
if (window.location.pathname.includes('/chat')) {
    startConversationListRefresh();
}
