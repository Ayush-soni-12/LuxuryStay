const express = require('express');
const router = express.Router();
const { submitContact, respondToContact } = require('../controllers/contact');
const isAdmin = require('../miniProject/middlewares/isAdmin');
const Contact = require('../Modals/contact');
const validToken= require("../miniProject//middlewares/validateToken.js");
router.use(express.json());


router.post('/contact', submitContact);

// Admin routes
router.get('/admin/contacts',validToken,isAdmin,  async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.render('adminContacts', { 
            contacts,
            message: req.query.message || null
        });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.redirect('/api/admin?message=' + encodeURIComponent('Error loading contacts'));
    }
});

router.post('/admin/contacts/:contactId/respond',validToken, isAdmin, respondToContact);

module.exports = router;
