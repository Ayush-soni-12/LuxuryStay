const Contact = require('../Modals/contact');
const { sendMail } = require('../miniProject/Helpers/mailer');
const ExpressError = require('../miniProject/middlewares/ExpressError');
const asyncHandler = require('../miniProject/middlewares/asyncHandler');



// Handle new contact form submission
module.exports.submitContact = asyncHandler(async (req, res) => {    try {
        const { name, email, subject, message } = req.body;

        // Create new contact entry
        const contact = new Contact({
            name,
            email,
            subject,
            message,
            status: 'pending'
        });
        await contact.save();

    // Send email notification to admin
    const adminMsg = `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <p>Please respond to this inquiry through the admin dashboard.</p>
    `;
    
    await sendMail(process.env.SMTP_MAIL || 'admin@luxurystays.com', 'New Contact Form Submission', adminMsg);

    // Send confirmation email to user
    const userMsg = `
        <h2>Thank you for contacting LuxuryStays</h2>
        <p>Dear ${name},</p>
        <p>We have received your message regarding "${subject}". Our team will review your inquiry and respond to you as soon as possible.</p>
        <p>For your reference, here is a copy of your message:</p>
        <blockquote style="margin: 15px 0; padding: 10px; border-left: 4px solid #FF5A5F; background-color: #f9f9f9;">
            ${message}
        </blockquote>
        <p>Best regards,</p>
        <p>The LuxuryStays Team</p>
    `;    await sendMail(email, 'We received your message - LuxuryStays', userMsg);

    res.redirect('/show/contact?message=' + encodeURIComponent('Thank you for your message. We will get back to you soon!') + '&type=success');
    } catch (error) {
        console.error('Contact form error:', error);
        res.redirect('/show/contact?message=' + encodeURIComponent('Error sending message. Please try again.') + '&type=error');
    }
});

// Admin: Respond to contact message
module.exports.respondToContact = asyncHandler(async (req, res) => {
    const { contactId } = req.params;
    const { response } = req.body;

    const contact = await Contact.findById(contactId);
    if (!contact) {
        throw new ExpressError('Contact message not found', 404);
    }

    // Update contact status
    contact.status = 'responded';
    contact.response = response;
    contact.responseDate = new Date();
    await contact.save();

    // Send response email to user
    const responseMsg = `
        <h2>Response to Your Inquiry</h2>
        <p>Dear ${contact.name},</p>
        <p>Thank you for contacting LuxuryStays. Here is our response to your inquiry about "${contact.subject}":</p>
        <blockquote style="margin: 15px 0; padding: 10px; border-left: 4px solid #FF5A5F; background-color: #f9f9f9;">
            ${response}
        </blockquote>
        <p>Your original message:</p>
        <blockquote style="margin: 15px 0; padding: 10px; border-left: 4px solid #ccc; background-color: #f9f9f9;">
            ${contact.message}
        </blockquote>
        <p>If you have any more questions, please don't hesitate to contact us again.</p>
        <p>Best regards,</p>
        <p>The LuxuryStays Team</p>
    `;

    await sendMail(contact.email, `Re: ${contact.subject} - LuxuryStays Response`, responseMsg);

    res.redirect('/api/admin/contacts?message=' + encodeURIComponent('Response sent successfully'));
});
