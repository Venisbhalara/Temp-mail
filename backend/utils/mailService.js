const axios = require('axios');

const MAIL_API_BASE = 'https://api.mail.tm';

/**
 * Mail.tm Service
 * Handles all communication with the Mail.tm API
 */
const mailService = {
    /**
     * Get available domains from Mail.tm
     */
    async getDomains() {
        try {
            const response = await axios.get(`${MAIL_API_BASE}/domains`);
            return response.data['hydra:member'] || [];
        } catch (error) {
            console.error('Error fetching domains:', error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Create a new account on Mail.tm
     */
    async createAccount(address, password) {
        try {
            const response = await axios.post(`${MAIL_API_BASE}/accounts`, {
                address,
                password
            });
            return response.data;
        } catch (error) {
            console.error('Error creating account:', error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Get JWT token for an account
     */
    async getToken(address, password) {
        try {
            const response = await axios.post(`${MAIL_API_BASE}/token`, {
                address,
                password
            });
            return response.data.token;
        } catch (error) {
            console.error('Error getting token:', error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Get all messages for an account
     */
    async getMessages(token) {
        try {
            const response = await axios.get(`${MAIL_API_BASE}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data['hydra:member'] || [];
        } catch (error) {
            console.error('Error fetching messages:', error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Get full detail for a specific message
     */
    async getMessage(token, id) {
        try {
            const response = await axios.get(`${MAIL_API_BASE}/messages/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching message details:', error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Delete a message
     */
    async deleteMessage(token, id) {
        try {
            await axios.delete(`${MAIL_API_BASE}/messages/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return true;
        } catch (error) {
            console.error('Error deleting message:', error.response?.data || error.message);
            throw error;
        }
    }
};

module.exports = mailService;
